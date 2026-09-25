function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err.message);
  const status = err.status || err.statusCode || 500;
  const message =
    status < 500
      ? err.message || 'Request failed.'
      : 'An unexpected server error occurred.';
  res.status(status).json({ error: message });
}

function notFound(_req, res) {
  res.status(404).json({ error: 'Not found.' });
}

module.exports = { errorHandler, notFound };
