const express = require('express');
const quizController = require('../controllers/quizController');
const { requireAuth } = require('../middleware/auth');
const { submitLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/config', quizController.getConfig);
router.get('/active', requireAuth, quizController.getActive);
router.post('/start', requireAuth, quizController.start);
router.get('/attempt/:attemptId', requireAuth, quizController.getAttempt);
router.put('/attempt/:attemptId/answers', requireAuth, quizController.saveProgress);
router.post(
  '/attempt/:attemptId/submit',
  requireAuth,
  submitLimiter,
  quizController.submit
);
router.get('/result', requireAuth, quizController.getMyResult);

module.exports = router;
