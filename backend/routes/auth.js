const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { authLimiter, adminLoginLimiter } = require('../middleware/rateLimit');
const config = require('../config');

const router = express.Router();

router.get('/status', authController.googleAuthAvailable);

router.get(
  '/google',
  authLimiter,
  (req, res, next) => {
    if (!config.google.clientId || !config.google.clientSecret) {
      return res.status(503).json({
        error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
  })
);

router.get('/google/callback', authLimiter, authController.googleCallback);

router.get('/me', authController.me);
router.post('/logout', authController.logout);
router.post('/admin/login', adminLoginLimiter, authController.adminLogin);

module.exports = router;
