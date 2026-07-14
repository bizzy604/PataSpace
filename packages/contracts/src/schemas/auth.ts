import { z } from 'zod';
import { Role } from '../enums';
import { phoneNumberSchema } from './common';

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[0-9]/, 'Must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must include at least one special character');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email();

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  // Phone stays required: listings, contact unlock, and M-Pesa all need it,
  // and it is the OTP target for verification and password recovery.
  phoneNumber: phoneNumberSchema,
});

export const registerResponseSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().regex(/^\d{4,6}$/),
});

export const resendOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const resendOtpResponseSchema = registerResponseSchema;

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Response is identical whether or not the account exists (anti-enumeration);
// no userId, and expiresIn is the constant OTP window.
export const forgotPasswordResponseSchema = z.object({
  message: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{4,6}$/),
  newPassword: passwordSchema,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  phoneNumber: phoneNumberSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.nativeEnum(Role),
  phoneVerified: z.boolean(),
  // Nullable, not optional-but-absent: every account has an email post
  // Clerk-removal, but accounts created before this migration (or via the
  // orphaned Clerk path) may still have none.
  email: emailSchema.nullable(),
});

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: authUserSchema,
});

export const refreshResponseSchema = authTokensSchema;
