const express = require('express');
const questionController = require('../controllers/questionController');
const adminController = require('../controllers/adminController');
const quizController = require('../controllers/quizController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

router.get('/dashboard', quizController.dashboardStats);

router.get('/questions', questionController.list);
router.post('/questions', questionController.create);
router.patch('/questions/reorder', questionController.reorder);
router.get('/questions/:id', questionController.getOne);
router.put('/questions/:id', questionController.update);
router.delete('/questions/:id', questionController.remove);
router.post('/questions/:id/duplicate', questionController.duplicate);
router.patch('/questions/:id/status', questionController.setStatus);

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

router.get('/results', adminController.listResults);
router.get('/results/:id', adminController.getResult);

module.exports = router;
