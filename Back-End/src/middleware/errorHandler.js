export function notFound(req, res, next) {
  res.status(404).json({ success: false, message: 'Not found' });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  res.status(status).json({ success: false, message });
}
