import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  registerVerifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validation/auth.schemas.js';

const SALT_ROUNDS = 12;

function setRefreshCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refresh_token', { path: '/' });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function register(data) {
  const existing = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase(), deletedAt: null },
  });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = data.password
    ? await bcrypt.hash(data.password, SALT_ROUNDS)
    : null;

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      passwordHash,
      organization: data.organization?.trim() || null,
      role: data.role || 'CUSTOMER',
      emailVerified: !!data.googleId,
      googleId: data.googleId || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isPremium: true,
      avatarUrl: true,
      organization: true,
    },
  });

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      userAgent: data.userAgent || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user, accessToken, refreshToken };
}

/** Step 1: Submit registration – store pending and send OTP (no user created until verify) */
export async function registerSendOtp(data) {
  const email = data.email.toLowerCase().trim();
  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = data.password
    ? await bcrypt.hash(data.password, SALT_ROUNDS)
    : null;

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.upsert({
    where: { email_type: { email, type: 'REGISTRATION_OTP' } },
    create: {
      email,
      token: otp,
      type: 'REGISTRATION_OTP',
      meta: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        passwordHash,
        organization: data.organization?.trim() || null,
      },
      expiresAt,
    },
    update: { token: otp, meta: { name: data.name.trim(), phone: data.phone.trim(), passwordHash, organization: data.organization?.trim() || null }, expiresAt },
  });

  const { sendRegistrationOtp } = await import('./mail.service.js');
  await sendRegistrationOtp({ to: email, otp });

  return { success: true, email };
}

/** Step 2: Verify OTP and complete registration – create user and return tokens */
export async function registerVerifyOtp(email, otp, userAgent) {
  const row = await prisma.verificationToken.findFirst({
    where: { email: email.toLowerCase().trim(), type: 'REGISTRATION_OTP' },
  });
  if (!row) {
    const err = new Error('Invalid or expired verification code');
    err.statusCode = 400;
    throw err;
  }
  if (row.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: row.id } }).catch(() => {});
    const err = new Error('Verification code has expired');
    err.statusCode = 400;
    throw err;
  }
  if (row.token !== String(otp).trim()) {
    const err = new Error('Invalid verification code');
    err.statusCode = 400;
    throw err;
  }

  const meta = row.meta || {};
  const user = await prisma.user.create({
    data: {
      email: row.email,
      name: (meta.name || 'User').toString(),
      phone: (meta.phone || '').toString(),
      passwordHash: meta.passwordHash ? String(meta.passwordHash) : null,
      organization: meta.organization ? String(meta.organization) : null,
      role: 'CUSTOMER',
      emailVerified: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isPremium: true,
      avatarUrl: true,
      organization: true,
    },
  });

  await prisma.verificationToken.delete({ where: { id: row.id } });

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      userAgent: userAgent || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user, accessToken, refreshToken };
}

export async function forgotPassword(email) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), deletedAt: null },
  });
  if (!user) {
    // Don't reveal whether email exists
    return { success: true };
  }
  if (!user.passwordHash) {
    return { success: true }; // Google-only user, no password to reset
  }

  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.upsert({
    where: { email_type: { email: user.email, type: 'PASSWORD_RESET' } },
    create: { email: user.email, token, type: 'PASSWORD_RESET', expiresAt },
    update: { token, expiresAt },
  });

  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontend}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const { sendPasswordResetLink } = await import('./mail.service.js');
  await sendPasswordResetLink({ to: user.email, resetLink });

  return { success: true };
}

export async function resetPassword(token, newPassword) {
  const row = await prisma.verificationToken.findFirst({
    where: { token: String(token).trim(), type: 'PASSWORD_RESET' },
  });
  if (!row || row.expiresAt < new Date()) {
    const err = new Error('Invalid or expired reset link');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.updateMany({
    where: { email: row.email },
    data: { passwordHash },
  });
  await prisma.verificationToken.delete({ where: { id: row.id } });

  return { success: true };
}

export async function login(email, password, userAgent) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), deletedAt: null },
  });
  if (!user || !user.passwordHash) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      userAgent: userAgent || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { passwordHash: _, ...safeUser } = user;
  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}

export async function refresh(refreshTokenValue, userAgent) {
  if (!refreshTokenValue) {
    const err = new Error('Refresh token required');
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenValue);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const user = stored.user;
  if (user.deletedAt) {
    await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    const err = new Error('User no longer active');
    err.statusCode = 401;
    throw err;
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newAccessToken = createAccessToken(user.id);
  const newRefreshToken = createRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      userAgent: userAgent || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { passwordHash: _, ...safeUser } = user;
  return {
    user: safeUser,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshTokenValue) {
  if (refreshTokenValue) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshTokenValue } }).catch(() => {});
  }
  return { success: true };
}

export async function findOrCreateGoogleUser(profile, userAgent) {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) {
    const err = new Error('Email not provided by Google');
    err.statusCode = 400;
    throw err;
  }

  let user = await prisma.user.findFirst({
    where: { googleId: profile.id },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id, emailVerified: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: profile.displayName?.trim() || profile.name?.givenName || 'User',
          phone: '', // Google doesn't provide phone; user may update later
          googleId: profile.id,
          emailVerified: true,
          role: 'CUSTOMER',
        },
      });
    }
  }

  if (user.deletedAt) {
    const err = new Error('Account is disabled');
    err.statusCode = 403;
    throw err;
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      userAgent: userAgent || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { passwordHash: _, ...safeUser } = user;
  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}

export async function registerHandler(req, res, next) {
  try {
    const body = registerSchema.parse(req.body);
    await registerSendOtp(body);
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: body.email.toLowerCase().trim(),
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: e.errors,
      });
    }
    next(e);
  }
}

export async function registerVerifyOtpHandler(req, res, next) {
  try {
    const body = registerVerifyOtpSchema.parse(req.body);
    const result = await registerVerifyOtp(
      body.email,
      body.otp,
      req.headers['user-agent']
    );
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: e.errors,
      });
    }
    next(e);
  }
}

export async function forgotPasswordHandler(req, res, next) {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    await forgotPassword(body.email);
    res.json({ success: true, message: 'If an account exists, you will receive a reset link by email.' });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: e.errors,
      });
    }
    next(e);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    const body = resetPasswordSchema.parse(req.body);
    await resetPassword(body.token, body.newPassword);
    res.json({ success: true, message: 'Password has been reset. You can now sign in.' });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: e.errors,
      });
    }
    next(e);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(
      body.email,
      body.password,
      req.headers['user-agent']
    );
    setRefreshCookie(res, result.refreshToken);
    res.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: e.errors,
      });
    }
    next(e);
  }
}

export async function refreshHandler(req, res, next) {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    const result = await refresh(token, req.headers['user-agent']);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (e) {
    clearRefreshCookie(res);
    next(e);
  }
}

export async function logoutHandler(req, res, next) {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    await logout(token);
    clearRefreshCookie(res);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

export function meHandler(req, res) {
  res.json({ success: true, user: req.user });
}

export function googleCallbackHandler(req, res) {
  const result = req.user;
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontend}/auth/callback?accessToken=${encodeURIComponent(result.accessToken)}`);
}
