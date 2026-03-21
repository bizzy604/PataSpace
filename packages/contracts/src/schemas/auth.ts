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

export const loginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: passwordSchema,
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
