const config = require('../config');

function logInfo(message, meta = {}) {
  const safe = sanitize(meta);
  console.log(`[INFO] ${message}`, Object.keys(safe).length ? safe : '');
}

function logWarn(message, meta = {}) {
  const safe = sanitize(meta);
  console.warn(`[WARN] ${message}`, Object.keys(safe).length ? safe : '');
}

function logError(message, meta = {}) {
  const safe = sanitize(meta);
  console.error(`[ERROR] ${message}`, Object.keys(safe).length ? safe : '');
}

function sanitize(meta) {
  const blocked = [
    'password',
    'passwordHash',
    'password_hash',
    'clientSecret',
    'client_secret',
    'token',
    'accessToken',
    'idToken',
    'session',
    'authorization',
  ];
  const out = {};
  for (const [k, v] of Object.entries(meta || {})) {
    if (blocked.some((b) => k.toLowerCase().includes(b.toLowerCase()))) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = v;
    }
  }
  if (!config.isProduction && meta?.stack) {
    out.stack = meta.stack;
  }
  return out;
}

module.exports = { logInfo, logWarn, logError };
