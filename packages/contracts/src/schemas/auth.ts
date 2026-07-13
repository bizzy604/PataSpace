import { z } from 'zod';
import { Role } from '../enums';
import { phoneNumberSchema } from './common';

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[0-9]/, 'Must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must include at least one special character');

export const registerSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: passwordSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional(),
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
  phoneNumber: phoneNumberSchema,
  password: passwordSchema,
});

/*
 * Email-identifier auth (Clerk removal, Docs/14 Phase 0). Additive for now:
 * the API still consumes the phone-identifier schemas above. Phase 1 makes
 * these canonical (login/register swap to email) and deletes the phone
 * login variant. Email is normalized (trim + lowercase) at the edge so the
 * API's unique-email lookup never sees case duplicates.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email();

export const emailRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  // Phone stays required: listings, contact unlock, and M-Pesa need it, and
  // it is the OTP target for verification and password recovery.
  phoneNumber: phoneNumberSchema,
});

export const emailLoginSchema = z.object({
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
  // Optional until Phase 1 backfills it into toAuthUser; existing clients
  // parsing sessions without an email must keep working.
  email: emailSchema.nullable().optional(),
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
