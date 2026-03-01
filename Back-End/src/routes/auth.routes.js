import { Router } from 'express';
import passport from 'passport';
import * as authService from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', authService.registerHandler);
router.post('/register/verify-otp', authService.registerVerifyOtpHandler);
router.post('/forgot-password', authService.forgotPasswordHandler);
router.post('/reset-password', authService.resetPasswordHandler);
router.post('/login', authService.loginHandler);
router.post('/refresh', authService.refreshHandler);
router.post('/logout', authService.logoutHandler);
router.get('/me', authenticate, authService.meHandler);

// Google OAuth
const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
if (hasGoogleConfig) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    authService.googleCallbackHandler
  );
} else {
  router.get('/google', (req, res) =>
    res.status(503).json({ success: false, message: 'Google login not configured' })
  );
}

export default router;
