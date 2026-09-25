/**
 * Extract and validate email domain exactly.
 * Rejects attackeriiitkota.ac.in and similar spoofed domains.
 */
function getEmailDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) return null;
  return normalized.slice(at + 1);
}

function isAllowedParticipantEmail(email, allowedDomain) {
  const domain = getEmailDomain(email);
  return domain === allowedDomain.toLowerCase();
}

function arraysEqualAsSets(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].map(String).sort();
  const sb = [...b].map(String).sort();
  return sa.every((v, i) => v === sb[i]);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function toPublicQuestion(question, optionOrder = null) {
  let options = Array.isArray(question.options)
    ? question.options
    : JSON.parse(question.options || '[]');

  if (optionOrder && Array.isArray(optionOrder)) {
    const map = Object.fromEntries(options.map((o) => [o.id, o]));
    options = optionOrder.map((id) => map[id]).filter(Boolean);
  }

  return {
    id: question.id,
    questionText: question.question_text || question.questionText,
    type: question.type,
    options,
    marks: Number(question.marks),
    order: question.order,
  };
}

function toAdminQuestion(question) {
  return {
    id: question.id,
    questionText: question.question_text,
    type: question.type,
    options: Array.isArray(question.options)
      ? question.options
      : JSON.parse(question.options || '[]'),
    correctAnswers: Array.isArray(question.correct_answers)
      ? question.correct_answers
      : JSON.parse(question.correct_answers || '[]'),
    explanation: question.explanation || '',
    marks: Number(question.marks),
    negativeMarks: Number(question.negative_marks),
    order: question.order,
    status: question.status,
    createdAt: question.created_at,
    updatedAt: question.updated_at,
  };
}

module.exports = {
  getEmailDomain,
  isAllowedParticipantEmail,
  arraysEqualAsSets,
  shuffle,
  formatDuration,
  toPublicQuestion,
  toAdminQuestion,
};
