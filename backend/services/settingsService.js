const { query } = require('../config/database');

async function getSettings() {
  const result = await query(
    'SELECT * FROM quiz_settings ORDER BY created_at ASC LIMIT 1'
  );
  return result.rows[0] || null;
}

async function updateSettings(data) {
  const current = await getSettings();
  if (!current) {
    const err = new Error('Quiz settings not found.');
    err.status = 404;
    throw err;
  }

  const result = await query(
    `UPDATE quiz_settings SET
      title = $1,
      description = $2,
      duration_minutes = $3,
      total_questions = $4,
      default_marks = $5,
      default_negative_marks = $6,
      allow_navigation = $7,
      randomize_questions = $8,
      randomize_options = $9,
      show_results = $10,
      show_correct_answers = $11,
      allow_retry = $12,
      is_active = $13,
      updated_at = NOW()
     WHERE id = $14
     RETURNING *`,
    [
      data.title,
      data.description,
      data.durationMinutes,
      data.totalQuestions,
      data.defaultMarks,
      data.defaultNegativeMarks,
      data.allowNavigation,
      data.randomizeQuestions,
      data.randomizeOptions,
      data.showResults,
      data.showCorrectAnswers,
      data.allowRetry,
      data.isActive !== undefined ? data.isActive : current.is_active,
      current.id,
    ]
  );
  return result.rows[0];
}

function toPublicSettings(row, publishedCount = null) {
  if (!row) return null;
  return {
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    totalQuestions:
      publishedCount !== null ? publishedCount : row.total_questions,
    defaultMarks: Number(row.default_marks),
    defaultNegativeMarks: Number(row.default_negative_marks),
    allowNavigation: row.allow_navigation,
    randomizeQuestions: row.randomize_questions,
    randomizeOptions: row.randomize_options,
    showResults: row.show_results,
    showCorrectAnswers: row.show_correct_answers,
    allowRetry: row.allow_retry,
    isActive: row.is_active,
  };
}

function toAdminSettings(row) {
  if (!row) return null;
  return {
    id: row.id,
    ...toPublicSettings(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  getSettings,
  updateSettings,
  toPublicSettings,
  toAdminSettings,
};
