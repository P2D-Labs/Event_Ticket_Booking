import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255).trim(),
  phone: z.string().min(1).max(30).trim(),
  organization: z.string().max(255).trim().optional(),
  role: z.enum(['CUSTOMER', 'ORGANIZER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const registerVerifyOtpSchema = z.object({
  email: z.string().email().max(255).transform((s) => s.toLowerCase().trim()),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(500),
  newPassword: z.string().min(8).max(128),
});
