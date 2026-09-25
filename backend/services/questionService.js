const { query, getClient } = require('../config/database');
const { toAdminQuestion, toPublicQuestion } = require('../utils/helpers');

async function listQuestions({ includeDeleted = false, status } = {}) {
  const clauses = [];
  const params = [];
  if (!includeDeleted) {
    clauses.push('deleted_at IS NULL');
  }
  if (status) {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await query(
    `SELECT * FROM questions ${where} ORDER BY "order" ASC, created_at ASC`,
    params
  );
  return result.rows.map(toAdminQuestion);
}

async function listPublishedQuestions() {
  const result = await query(
    `SELECT * FROM questions
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY "order" ASC, created_at ASC`
  );
  return result.rows;
}

async function getById(id, { admin = false } = {}) {
  const result = await query(
    `SELECT * FROM questions WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return admin ? toAdminQuestion(row) : toPublicQuestion(row);
}

async function getRawById(id) {
  const result = await query(
    `SELECT * FROM questions WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return result.rows[0] || null;
}

function validateQuestionPayload(data) {
  const errors = [];
  if (!data.questionText || !String(data.questionText).trim()) {
    errors.push('Question text is required.');
  }
  const type = data.type;
  if (!['single_choice', 'multiple_choice', 'true_false'].includes(type)) {
    errors.push('Invalid question type.');
  }
  const options = data.options || [];
  const correct = data.correctAnswers || [];

  if (type === 'true_false') {
    if (options.length !== 2) errors.push('True/False must have exactly two options.');
    if (correct.length !== 1) errors.push('True/False must have exactly one correct answer.');
  } else if (type === 'single_choice') {
    if (options.length < 2) errors.push('Single-choice needs at least 2 options.');
    if (correct.length !== 1) errors.push('Single-choice must have exactly one correct answer.');
  } else if (type === 'multiple_choice') {
    if (options.length < 2) errors.push('Multiple-choice needs at least 2 options.');
    if (correct.length < 1) errors.push('Multiple-choice must have at least one correct answer.');
  }

  const optionIds = new Set(options.map((o) => o.id));
  for (const c of correct) {
    if (!optionIds.has(c)) {
      errors.push(`Correct answer "${c}" is not a valid option.`);
    }
  }

  if (data.marks !== undefined && Number(data.marks) < 0) {
    errors.push('Marks cannot be negative.');
  }
  if (data.negativeMarks !== undefined && Number(data.negativeMarks) < 0) {
    errors.push('Negative marks cannot be negative.');
  }
  if (data.status && !['draft', 'published'].includes(data.status)) {
    errors.push('Invalid status.');
  }

  return errors;
}

async function createQuestion(data) {
  const errors = validateQuestionPayload(data);
  if (errors.length) {
    const err = new Error(errors.join(' '));
    err.status = 400;
    throw err;
  }

  let order = data.order;
  if (order === undefined || order === null) {
    const max = await query(
      `SELECT COALESCE(MAX("order"), 0)::int AS m FROM questions WHERE deleted_at IS NULL`
    );
    order = max.rows[0].m + 1;
  }

  const result = await query(
    `INSERT INTO questions (
      question_text, type, options, correct_answers, explanation,
      marks, negative_marks, "order", status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      data.questionText.trim(),
      data.type,
      JSON.stringify(data.options),
      JSON.stringify(data.correctAnswers),
      data.explanation || '',
      data.marks ?? 1,
      data.negativeMarks ?? 0,
      order,
      data.status || 'draft',
    ]
  );
  await syncPublishedCount();
  return toAdminQuestion(result.rows[0]);
}

async function updateQuestion(id, data) {
  const existing = await getRawById(id);
  if (!existing) {
    const err = new Error('Question not found.');
    err.status = 404;
    throw err;
  }

  const payload = {
    questionText: data.questionText ?? existing.question_text,
    type: data.type ?? existing.type,
    options: data.options ?? (Array.isArray(existing.options) ? existing.options : JSON.parse(existing.options)),
    correctAnswers:
      data.correctAnswers ??
      (Array.isArray(existing.correct_answers)
        ? existing.correct_answers
        : JSON.parse(existing.correct_answers)),
    explanation: data.explanation ?? existing.explanation,
    marks: data.marks ?? Number(existing.marks),
    negativeMarks: data.negativeMarks ?? Number(existing.negative_marks),
    order: data.order ?? existing.order,
    status: data.status ?? existing.status,
  };

  const errors = validateQuestionPayload(payload);
  if (errors.length) {
    const err = new Error(errors.join(' '));
    err.status = 400;
    throw err;
  }

  const result = await query(
    `UPDATE questions SET
      question_text = $1, type = $2, options = $3, correct_answers = $4,
      explanation = $5, marks = $6, negative_marks = $7, "order" = $8,
      status = $9, updated_at = NOW()
     WHERE id = $10 AND deleted_at IS NULL
     RETURNING *`,
    [
      payload.questionText.trim(),
      payload.type,
      JSON.stringify(payload.options),
      JSON.stringify(payload.correctAnswers),
      payload.explanation || '',
      payload.marks,
      payload.negativeMarks,
      payload.order,
      payload.status,
      id,
    ]
  );
  await syncPublishedCount();
  return toAdminQuestion(result.rows[0]);
}

async function softDeleteQuestion(id) {
  const result = await query(
    `UPDATE questions SET deleted_at = NOW(), status = 'draft', updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  );
  if (!result.rows[0]) {
    const err = new Error('Question not found.');
    err.status = 404;
    throw err;
  }
  await syncPublishedCount();
  return true;
}

async function duplicateQuestion(id) {
  const existing = await getRawById(id);
  if (!existing) {
    const err = new Error('Question not found.');
    err.status = 404;
    throw err;
  }
  const max = await query(
    `SELECT COALESCE(MAX("order"), 0)::int AS m FROM questions WHERE deleted_at IS NULL`
  );
  const result = await query(
    `INSERT INTO questions (
      question_text, type, options, correct_answers, explanation,
      marks, negative_marks, "order", status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
    RETURNING *`,
    [
      existing.question_text,
      existing.type,
      JSON.stringify(existing.options),
      JSON.stringify(existing.correct_answers),
      existing.explanation,
      existing.marks,
      existing.negative_marks,
      max.rows[0].m + 1,
    ]
  );
  await syncPublishedCount();
  return toAdminQuestion(result.rows[0]);
}

async function setStatus(id, status) {
  if (!['draft', 'published'].includes(status)) {
    const err = new Error('Invalid status.');
    err.status = 400;
    throw err;
  }
  const result = await query(
    `UPDATE questions SET status = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [status, id]
  );
  if (!result.rows[0]) {
    const err = new Error('Question not found.');
    err.status = 404;
    throw err;
  }
  await syncPublishedCount();
  return toAdminQuestion(result.rows[0]);
}

async function reorderQuestions(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    const err = new Error('orderedIds must be a non-empty array.');
    err.status = 400;
    throw err;
  }
  const client = await getClient();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i += 1) {
      await client.query(
        `UPDATE questions SET "order" = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL`,
        [i + 1, orderedIds[i]]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return listQuestions();
}

async function syncPublishedCount() {
  const published = await query(
    `SELECT COUNT(*)::int AS c FROM questions WHERE status = 'published' AND deleted_at IS NULL`
  );
  await query(
    `UPDATE quiz_settings SET total_questions = $1, updated_at = NOW()`,
    [published.rows[0].c]
  );
}

async function getStats() {
  const result = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM questions WHERE deleted_at IS NULL) AS total,
      (SELECT COUNT(*)::int FROM questions WHERE status = 'published' AND deleted_at IS NULL) AS published,
      (SELECT COUNT(*)::int FROM questions WHERE status = 'draft' AND deleted_at IS NULL) AS draft,
      (SELECT COUNT(*)::int FROM quiz_attempts WHERE status IN ('submitted', 'expired')) AS attempts
  `);
  return result.rows[0];
}

module.exports = {
  listQuestions,
  listPublishedQuestions,
  getById,
  getRawById,
  createQuestion,
  updateQuestion,
  softDeleteQuestion,
  duplicateQuestion,
  setStatus,
  reorderQuestions,
  syncPublishedCount,
  getStats,
  validateQuestionPayload,
};
