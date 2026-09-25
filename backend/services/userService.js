const { query } = require('../config/database');

async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findByGoogleId(googleId) {
  const result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return result.rows[0] || null;
}

async function findByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return result.rows[0] || null;
}

async function findAdminByUsername(username) {
  const email = `${username}@admin.local`;
  const result = await query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = 'admin'`,
    [email]
  );
  return result.rows[0] || null;
}

async function upsertGoogleUser({ googleId, email, name, profilePicture, emailVerified }) {
  const existing = await findByGoogleId(googleId);
  if (existing) {
    const result = await query(
      `UPDATE users SET
        email = $1, name = $2, profile_picture = $3, email_verified = $4,
        last_login_at = NOW(), updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [email.toLowerCase(), name, profilePicture, emailVerified, existing.id]
    );
    return result.rows[0];
  }

  const byEmail = await findByEmail(email);
  if (byEmail && !byEmail.google_id) {
    const result = await query(
      `UPDATE users SET
        google_id = $1, name = $2, profile_picture = $3, email_verified = $4,
        last_login_at = NOW(), updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [googleId, name, profilePicture, emailVerified, byEmail.id]
    );
    return result.rows[0];
  }

  if (byEmail && byEmail.google_id && byEmail.google_id !== googleId) {
    const err = new Error('Email already associated with another account.');
    err.status = 409;
    throw err;
  }

  const result = await query(
    `INSERT INTO users (
      google_id, email, name, profile_picture, email_verified, role, last_login_at
    ) VALUES ($1, $2, $3, $4, $5, 'participant', NOW())
    RETURNING *`,
    [googleId, email.toLowerCase(), name, profilePicture, emailVerified]
  );
  return result.rows[0];
}

function toSafeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePicture: user.profile_picture,
    emailVerified: user.email_verified,
    role: user.role,
    lastLoginAt: user.last_login_at,
  };
}

module.exports = {
  findById,
  findByGoogleId,
  findByEmail,
  findAdminByUsername,
  upsertGoogleUser,
  toSafeUser,
};
