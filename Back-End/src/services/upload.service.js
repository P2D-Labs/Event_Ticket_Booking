export function uploadHandler(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
}

export function uploadErrorHandler(err, req, res, next) {
  if (err) {
    return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
  }
  next();
}
