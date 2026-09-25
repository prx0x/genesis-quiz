const { query, getClient } = require('../config/database');
const settingsService = require('./settingsService');
const questionService = require('./questionService');
const {
  arraysEqualAsSets,
  shuffle,
  toPublicQuestion,
  formatDuration,
} = require('../utils/helpers');
const { logInfo, logWarn } = require('../utils/logger');

async function getPublishedCount() {
  const result = await query(
    `SELECT COUNT(*)::int AS c FROM questions WHERE status = 'published' AND deleted_at IS NULL`
  );
  return result.rows[0].c;
}

async function getPublicConfig() {
  const settings = await settingsService.getSettings();
  const publishedCount = await getPublishedCount();
  return settingsService.toPublicSettings(settings, publishedCount);
}

async function findActiveAttempt(userId) {
  const result = await query(
    `SELECT * FROM quiz_attempts
     WHERE user_id = $1 AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function findCompletedAttempt(userId) {
  const result = await query(
    `SELECT * FROM quiz_attempts
     WHERE user_id = $1 AND status IN ('submitted', 'expired')
     ORDER BY submitted_at DESC NULLS LAST, started_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

function getRemainingSeconds(attempt) {
  const durationMs = attempt.duration_minutes * 60 * 1000;
  const endsAt = new Date(attempt.started_at).getTime() + durationMs;
  return Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
}

async function expireAttemptIfNeeded(attempt) {
  if (!attempt || attempt.status !== 'in_progress') return attempt;
  if (getRemainingSeconds(attempt) > 0) return attempt;

  logInfo('Auto-expiring attempt', { attemptId: attempt.id });
  const saved = await query(
    `SELECT * FROM submitted_answers WHERE attempt_id = $1`,
    [attempt.id]
  );
  const answers = saved.rows.map((r) => ({
    questionId: r.question_id,
    selectedAnswers: Array.isArray(r.selected_answers)
      ? r.selected_answers
      : JSON.parse(r.selected_answers || '[]'),
  }));
  return finalizeAttempt(attempt, answers, 'expired');
}

async function startAttempt(userId) {
  const settings = await settingsService.getSettings();
  if (!settings || !settings.is_active) {
    const err = new Error('Quiz is currently unavailable.');
    err.status = 403;
    throw err;
  }

  let active = await findActiveAttempt(userId);
  if (active) {
    active = await expireAttemptIfNeeded(active);
    if (active.status === 'in_progress') {
      return buildAttemptPayload(active);
    }
  }

  const completed = await findCompletedAttempt(userId);
  if (completed && !settings.allow_retry) {
    const err = new Error('You have already completed this quiz.');
    err.status = 403;
    err.code = 'ALREADY_COMPLETED';
    throw err;
  }

  const questions = await questionService.listPublishedQuestions();
  if (!questions.length) {
    const err = new Error('No published questions available.');
    err.status = 400;
    throw err;
  }

  let questionOrder = questions.map((q) => q.id);
  if (settings.randomize_questions) {
    questionOrder = shuffle(questionOrder);
  }

  const optionOrders = {};
  for (const q of questions) {
    const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
    const ids = options.map((o) => o.id);
    optionOrders[q.id] = settings.randomize_options ? shuffle(ids) : ids;
  }

  const result = await query(
    `INSERT INTO quiz_attempts (
      user_id, quiz_settings_id, started_at, status,
      question_order, option_orders, duration_minutes, maximum_score
    ) VALUES ($1, $2, NOW(), 'in_progress', $3, $4, $5, $6)
    RETURNING *`,
    [
      userId,
      settings.id,
      JSON.stringify(questionOrder),
      JSON.stringify(optionOrders),
      settings.duration_minutes,
      questions.reduce((sum, q) => sum + Number(q.marks), 0),
    ]
  );

  logInfo('Quiz started', { userId, attemptId: result.rows[0].id });
  return buildAttemptPayload(result.rows[0]);
}

async function getSavedAnswersMap(attemptId) {
  const result = await query(
    `SELECT question_id, selected_answers FROM submitted_answers WHERE attempt_id = $1`,
    [attemptId]
  );
  const map = {};
  for (const row of result.rows) {
    map[row.question_id] = Array.isArray(row.selected_answers)
      ? row.selected_answers
      : JSON.parse(row.selected_answers || '[]');
  }
  return map;
}

async function buildAttemptPayload(attempt) {
  const settings = await settingsService.getSettings();
  const questionOrder = Array.isArray(attempt.question_order)
    ? attempt.question_order
    : JSON.parse(attempt.question_order || '[]');
  const optionOrders =
    typeof attempt.option_orders === 'object' && !Array.isArray(attempt.option_orders)
      ? attempt.option_orders
      : JSON.parse(attempt.option_orders || '{}');

  const questions = await questionService.listPublishedQuestions();
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));

  const ordered = questionOrder
    .map((id) => byId[id])
    .filter(Boolean)
    .map((q) => toPublicQuestion(q, optionOrders[q.id]));

  const answers = await getSavedAnswersMap(attempt.id);
  const remainingSeconds = getRemainingSeconds(attempt);

  return {
    attemptId: attempt.id,
    status: attempt.status,
    startedAt: attempt.started_at,
    remainingSeconds,
    durationMinutes: attempt.duration_minutes,
    allowNavigation: settings.allow_navigation,
    questions: ordered,
    answers,
  };
}

async function saveAnswers(attemptId, userId, answers) {
  let attempt = await getAttemptForUser(attemptId, userId);
  attempt = await expireAttemptIfNeeded(attempt);

  if (attempt.status !== 'in_progress') {
    const err = new Error('Attempt is no longer active.');
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(answers)) {
    const err = new Error('Invalid answers payload.');
    err.status = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    for (const ans of answers) {
      if (!ans.questionId) continue;
      const selected = Array.isArray(ans.selectedAnswers) ? ans.selectedAnswers : [];
      await client.query(
        `INSERT INTO submitted_answers (attempt_id, question_id, selected_answers, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (attempt_id, question_id)
         DO UPDATE SET selected_answers = EXCLUDED.selected_answers, updated_at = NOW()`,
        [attemptId, ans.questionId, JSON.stringify(selected)]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { ok: true };
}

async function getAttemptForUser(attemptId, userId) {
  const result = await query(`SELECT * FROM quiz_attempts WHERE id = $1`, [attemptId]);
  const attempt = result.rows[0];
  if (!attempt) {
    const err = new Error('Attempt not found.');
    err.status = 404;
    throw err;
  }
  if (attempt.user_id !== userId) {
    const err = new Error('You cannot access this attempt.');
    err.status = 403;
    throw err;
  }
  return attempt;
}

async function submitAttempt(attemptId, userId, answers) {
  let attempt = await getAttemptForUser(attemptId, userId);

  if (attempt.status === 'submitted' || attempt.status === 'expired') {
    const err = new Error('This attempt has already been submitted.');
    err.status = 400;
    err.code = 'ALREADY_SUBMITTED';
    throw err;
  }

  const remaining = getRemainingSeconds(attempt);
  const finalStatus = remaining <= 0 ? 'expired' : 'submitted';

  // Merge with any previously saved answers
  const saved = await getSavedAnswersMap(attemptId);
  const merged = { ...saved };
  if (Array.isArray(answers)) {
    for (const a of answers) {
      if (a.questionId) {
        merged[a.questionId] = Array.isArray(a.selectedAnswers) ? a.selectedAnswers : [];
      }
    }
  }

  const answerList = Object.entries(merged).map(([questionId, selectedAnswers]) => ({
    questionId,
    selectedAnswers,
  }));

  const finalized = await finalizeAttempt(attempt, answerList, finalStatus);
  logInfo('Quiz submitted', {
    userId,
    attemptId,
    status: finalStatus,
    score: finalized.score,
  });
  return buildResultPayload(finalized);
}

async function finalizeAttempt(attempt, answers, status) {
  const settings = await settingsService.getSettings();
  const questionOrder = Array.isArray(attempt.question_order)
    ? attempt.question_order
    : JSON.parse(attempt.question_order || '[]');

  const questions = await questionService.listPublishedQuestions();
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const answerMap = Object.fromEntries(
    (answers || []).map((a) => [a.questionId, a.selectedAnswers || []])
  );

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let maximumScore = 0;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    for (const qid of questionOrder) {
      const q = byId[qid];
      if (!q) continue;
      const marks = Number(q.marks);
      const neg = Number(q.negative_marks);
      maximumScore += marks;

      const correct = Array.isArray(q.correct_answers)
        ? q.correct_answers
        : JSON.parse(q.correct_answers || '[]');
      const selected = answerMap[qid] || [];

      let isCorrect = false;
      let awarded = 0;

      if (!selected.length) {
        unansweredCount += 1;
        awarded = 0;
        isCorrect = false;
      } else if (arraysEqualAsSets(selected, correct)) {
        correctCount += 1;
        awarded = marks;
        isCorrect = true;
      } else {
        incorrectCount += 1;
        awarded = -neg;
        isCorrect = false;
      }
      score += awarded;

      await client.query(
        `INSERT INTO submitted_answers (
          attempt_id, question_id, selected_answers, is_correct, marks_awarded, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (attempt_id, question_id)
        DO UPDATE SET
          selected_answers = EXCLUDED.selected_answers,
          is_correct = EXCLUDED.is_correct,
          marks_awarded = EXCLUDED.marks_awarded,
          updated_at = NOW()`,
        [attempt.id, qid, JSON.stringify(selected), selected.length ? isCorrect : null, awarded]
      );
    }

    if (score < 0) score = 0;
    const percentage = maximumScore > 0 ? Math.round((score / maximumScore) * 10000) / 100 : 0;
    const started = new Date(attempt.started_at).getTime();
    const now = Date.now();
    const durationLimit = attempt.duration_minutes * 60 * 1000;
    const timeTaken = Math.min(
      Math.floor((now - started) / 1000),
      Math.floor(durationLimit / 1000)
    );

    const result = await client.query(
      `UPDATE quiz_attempts SET
        status = $1,
        submitted_at = NOW(),
        score = $2,
        maximum_score = $3,
        percentage = $4,
        correct_count = $5,
        incorrect_count = $6,
        unanswered_count = $7,
        time_taken_seconds = $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        status,
        score,
        maximumScore,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount,
        timeTaken,
        attempt.id,
      ]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function buildResultPayload(attempt, { includeAnswers = false } = {}) {
  const settings = await settingsService.getSettings();
  const showResults = settings.show_results;
  const showCorrect = settings.show_correct_answers;

  const base = {
    attemptId: attempt.id,
    status: attempt.status,
    showResults,
    showCorrectAnswers: showCorrect,
  };

  if (!showResults) {
    return {
      ...base,
      message: 'Your quiz has been submitted. Results will be announced later.',
    };
  }

  const payload = {
    ...base,
    score: Number(attempt.score),
    maximumScore: Number(attempt.maximum_score),
    percentage: Number(attempt.percentage),
    correctCount: attempt.correct_count,
    incorrectCount: attempt.incorrect_count,
    unansweredCount: attempt.unanswered_count,
    timeTakenSeconds: attempt.time_taken_seconds,
    timeTaken: formatDuration(attempt.time_taken_seconds),
    submittedAt: attempt.submitted_at,
  };

  if (showCorrect || includeAnswers) {
    const questionOrder = Array.isArray(attempt.question_order)
      ? attempt.question_order
      : JSON.parse(attempt.question_order || '[]');
    const answers = await query(
      `SELECT sa.*, q.question_text, q.type, q.options, q.correct_answers, q.explanation
       FROM submitted_answers sa
       JOIN questions q ON q.id = sa.question_id
       WHERE sa.attempt_id = $1`,
      [attempt.id]
    );
    const byQ = Object.fromEntries(answers.rows.map((r) => [r.question_id, r]));
    payload.review = questionOrder.map((qid) => {
      const row = byQ[qid];
      if (!row) return null;
      return {
        questionId: qid,
        questionText: row.question_text,
        type: row.type,
        selectedAnswers: Array.isArray(row.selected_answers)
          ? row.selected_answers
          : JSON.parse(row.selected_answers || '[]'),
        correctAnswers: showCorrect
          ? Array.isArray(row.correct_answers)
            ? row.correct_answers
            : JSON.parse(row.correct_answers || '[]')
          : undefined,
        explanation: showCorrect ? row.explanation : undefined,
        isCorrect: row.is_correct,
        marksAwarded: Number(row.marks_awarded),
      };
    }).filter(Boolean);
  }

  return payload;
}

async function getResultForUser(userId) {
  let active = await findActiveAttempt(userId);
  if (active) {
    active = await expireAttemptIfNeeded(active);
    if (active.status === 'in_progress') {
      return { status: 'in_progress', attemptId: active.id };
    }
    return buildResultPayload(active);
  }
  const completed = await findCompletedAttempt(userId);
  if (!completed) {
    return null;
  }
  return buildResultPayload(completed);
}

async function getAttemptState(attemptId, userId) {
  let attempt = await getAttemptForUser(attemptId, userId);
  attempt = await expireAttemptIfNeeded(attempt);
  if (attempt.status !== 'in_progress') {
    return {
      status: attempt.status,
      result: await buildResultPayload(attempt),
    };
  }
  return buildAttemptPayload(attempt);
}

async function listResults({ search = '', sort = 'submitted_at', order = 'desc' } = {}) {
  const allowedSort = {
    submitted_at: 'a.submitted_at',
    score: 'a.score',
    percentage: 'a.percentage',
    email: 'u.email',
    name: 'u.name',
    time_taken: 'a.time_taken_seconds',
  };
  const sortCol = allowedSort[sort] || 'a.submitted_at';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  const params = [];
  let where = `WHERE a.status IN ('submitted', 'expired')`;
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where += ` AND (LOWER(u.email) LIKE $${params.length} OR LOWER(u.name) LIKE $${params.length})`;
  }

  const result = await query(
    `SELECT
      a.id, a.score, a.maximum_score, a.percentage,
      a.correct_count, a.incorrect_count, a.unanswered_count,
      a.time_taken_seconds, a.submitted_at, a.status,
      u.name, u.email
     FROM quiz_attempts a
     JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY ${sortCol} ${sortDir} NULLS LAST`,
    params
  );

  return result.rows.map((r) => ({
    id: r.id,
    participant: r.name,
    email: r.email,
    score: Number(r.score),
    maximumScore: Number(r.maximum_score),
    percentage: Number(r.percentage),
    correctCount: r.correct_count,
    incorrectCount: r.incorrect_count,
    unansweredCount: r.unanswered_count,
    timeTaken: formatDuration(r.time_taken_seconds),
    timeTakenSeconds: r.time_taken_seconds,
    submittedAt: r.submitted_at,
    status: r.status,
  }));
}

async function getResultById(id) {
  const result = await query(
    `SELECT a.*, u.name, u.email
     FROM quiz_attempts a
     JOIN users u ON u.id = a.user_id
     WHERE a.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  const payload = await buildResultPayload(row, { includeAnswers: true });
  return {
    ...payload,
    participant: row.name,
    email: row.email,
  };
}

module.exports = {
  getPublicConfig,
  startAttempt,
  getAttemptState,
  saveAnswers,
  submitAttempt,
  getResultForUser,
  listResults,
  getResultById,
  findActiveAttempt,
  findCompletedAttempt,
  expireAttemptIfNeeded,
};
