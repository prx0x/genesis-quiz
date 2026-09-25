const quizService = require('../services/quizService');
const questionService = require('../services/questionService');

async function getConfig(_req, res, next) {
  try {
    const config = await quizService.getPublicConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
}

async function start(req, res, next) {
  try {
    const payload = await quizService.startAttempt(req.session.userId);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

async function getAttempt(req, res, next) {
  try {
    const payload = await quizService.getAttemptState(
      req.params.attemptId,
      req.session.userId
    );
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

async function saveProgress(req, res, next) {
  try {
    const result = await quizService.saveAnswers(
      req.params.attemptId,
      req.session.userId,
      req.body.answers || []
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const result = await quizService.submitAttempt(
      req.params.attemptId,
      req.session.userId,
      req.body.answers || []
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getMyResult(req, res, next) {
  try {
    const result = await quizService.getResultForUser(req.session.userId);
    if (!result) {
      return res.status(404).json({ error: 'No result found.' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getActive(req, res, next) {
  try {
    let active = await quizService.findActiveAttempt(req.session.userId);
    if (active) {
      active = await quizService.expireAttemptIfNeeded(active);
      if (active.status === 'in_progress') {
        const payload = await quizService.getAttemptState(active.id, req.session.userId);
        return res.json({ active: true, attempt: payload });
      }
    }
    const completed = await quizService.findCompletedAttempt(req.session.userId);
    res.json({
      active: false,
      completed: Boolean(completed),
      completedAttemptId: completed?.id || null,
    });
  } catch (err) {
    next(err);
  }
}

async function dashboardStats(_req, res, next) {
  try {
    const stats = await questionService.getStats();
    res.json({
      totalQuestions: stats.total,
      publishedQuestions: stats.published,
      draftQuestions: stats.draft,
      totalAttempts: stats.attempts,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConfig,
  start,
  getAttempt,
  saveProgress,
  submit,
  getMyResult,
  getActive,
  dashboardStats,
};
