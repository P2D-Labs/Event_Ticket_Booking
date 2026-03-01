import csrf from 'csurf';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600,
};

export const csrfProtection = csrf({
  cookie: { ...cookieOptions, key: 'csrf_token' },
});

export function csrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).json({ success: false, message: 'Invalid CSRF token' });
}
