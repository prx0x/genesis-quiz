const settingsService = require('../services/settingsService');
const quizService = require('../services/quizService');
const { logInfo } = require('../utils/logger');

async function getSettings(_req, res, next) {
  try {
    const settings = await settingsService.getSettings();
    res.json(settingsService.toAdminSettings(settings));
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const body = req.body || {};
    const updated = await settingsService.updateSettings({
      title: body.title,
      description: body.description,
      durationMinutes: Number(body.durationMinutes),
      totalQuestions: Number(body.totalQuestions),
      defaultMarks: Number(body.defaultMarks),
      defaultNegativeMarks: Number(body.defaultNegativeMarks),
      allowNavigation: Boolean(body.allowNavigation),
      randomizeQuestions: Boolean(body.randomizeQuestions),
      randomizeOptions: Boolean(body.randomizeOptions),
      showResults: Boolean(body.showResults),
      showCorrectAnswers: Boolean(body.showCorrectAnswers),
      allowRetry: Boolean(body.allowRetry),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });
    logInfo('Quiz settings updated', { adminId: req.session.userId });
    res.json(settingsService.toAdminSettings(updated));
  } catch (err) {
    next(err);
  }
}

async function listResults(req, res, next) {
  try {
    const results = await quizService.listResults({
      search: req.query.search || '',
      sort: req.query.sort || 'submitted_at',
      order: req.query.order || 'desc',
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
}

async function getResult(req, res, next) {
  try {
    const result = await quizService.getResultById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found.' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  listResults,
  getResult,
};
