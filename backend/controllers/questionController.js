const questionService = require('../services/questionService');
const { logInfo } = require('../utils/logger');

async function list(_req, res, next) {
  try {
    const questions = await questionService.listQuestions();
    res.json(questions);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const question = await questionService.getById(req.params.id, { admin: true });
    if (!question) return res.status(404).json({ error: 'Question not found.' });
    res.json(question);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const question = await questionService.createQuestion(req.body);
    logInfo('Question created', { questionId: question.id, adminId: req.session.userId });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const question = await questionService.updateQuestion(req.params.id, req.body);
    logInfo('Question updated', { questionId: question.id, adminId: req.session.userId });
    res.json(question);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await questionService.softDeleteQuestion(req.params.id);
    logInfo('Question deleted', { questionId: req.params.id, adminId: req.session.userId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function duplicate(req, res, next) {
  try {
    const question = await questionService.duplicateQuestion(req.params.id);
    logInfo('Question duplicated', {
      sourceId: req.params.id,
      questionId: question.id,
      adminId: req.session.userId,
    });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const question = await questionService.setStatus(req.params.id, req.body.status);
    logInfo('Question status changed', {
      questionId: question.id,
      status: question.status,
      adminId: req.session.userId,
    });
    res.json(question);
  } catch (err) {
    next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const questions = await questionService.reorderQuestions(req.body.orderedIds);
    logInfo('Questions reordered', { adminId: req.session.userId });
    res.json(questions);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  duplicate,
  setStatus,
  reorder,
};
