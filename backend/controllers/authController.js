const passport = require('passport');
const bcrypt = require('bcryptjs');
const config = require('../config');
const userService = require('../services/userService');
const { query } = require('../config/database');
const { logInfo, logWarn } = require('../utils/logger');

function establishSession(req, user, authType = 'google') {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.name = user.name;
      req.session.role = user.role;
      req.session.profilePicture = user.profile_picture;
      req.session.authType = authType;
      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr);
        resolve();
      });
    });
  });
}

async function googleCallback(req, res, next) {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      logWarn('Google OAuth error', { message: err.message });
      return res.redirect(
        `${config.frontendUrl}/?authError=${encodeURIComponent('Authentication failed.')}`
      );
    }
    if (!user) {
      const message =
        (info && info.message) ||
        `Only @${config.allowedEmailDomain} Google accounts are allowed to participate.`;
      return res.redirect(
        `${config.frontendUrl}/?authError=${encodeURIComponent(message)}`
      );
    }
    try {
      await establishSession(req, user, 'google');
      return res.redirect(`${config.frontendUrl}/`);
    } catch (e) {
      logWarn('Session creation failed', { message: e.message });
      return res.redirect(
        `${config.frontendUrl}/?authError=${encodeURIComponent('Session creation failed.')}`
      );
    }
  })(req, res, next);
}

async function me(req, res) {
  if (!req.session || !req.session.userId) {
    return res.json({ authenticated: false, user: null });
  }
  const user = await userService.findById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ authenticated: false, user: null });
  }
  return res.json({
    authenticated: true,
    user: userService.toSafeUser(user),
  });
}

async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ ok: true });
  });
}

async function adminLogin(req, res) {
  const { username, password } = req.body || {};
  const ip = req.ip;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const recent = await query(
    `SELECT COUNT(*)::int AS c FROM login_attempts
     WHERE identifier = $1 AND success = false
       AND created_at > NOW() - INTERVAL '15 minutes'`,
    [String(username).toLowerCase()]
  );
  if (recent.rows[0].c >= 10) {
    return res.status(429).json({ error: 'Too many failed login attempts. Try again later.' });
  }

  const admin = await userService.findAdminByUsername(username);
  let success = false;

  if (admin && admin.password_hash) {
    success = await bcrypt.compare(password, admin.password_hash);
  }

  await query(
    `INSERT INTO login_attempts (identifier, ip_address, success) VALUES ($1, $2, $3)`,
    [String(username).toLowerCase(), ip, success]
  );

  if (!success) {
    logWarn('Admin login failed', { username: String(username).toLowerCase() });
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  await query(
    `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [admin.id]
  );

  await establishSession(req, admin, 'password');
  logInfo('Admin login success', { userId: admin.id });
  return res.json({ ok: true, user: userService.toSafeUser(admin) });
}

function googleAuthAvailable(_req, res) {
  res.json({
    available: Boolean(config.google.clientId && config.google.clientSecret),
    allowedDomain: config.allowedEmailDomain,
  });
}

module.exports = {
  googleCallback,
  me,
  logout,
  adminLogin,
  googleAuthAvailable,
  establishSession,
};
