function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

function requireParticipant(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.session.role === 'admin' && req.session.authType === 'password') {
    // Password-only admin may still browse; participant quiz needs participant role
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

function attachUser(req, _res, next) {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      email: req.session.email,
      name: req.session.name,
      role: req.session.role,
      profilePicture: req.session.profilePicture,
    };
  }
  next();
}

module.exports = {
  requireAuth,
  requireParticipant,
  requireAdmin,
  attachUser,
};
