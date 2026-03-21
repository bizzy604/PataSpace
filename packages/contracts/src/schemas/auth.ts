import { z } from 'zod';
import { Role } from '../enums';
import { phoneNumberSchema } from './common';

export const registerSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional(),
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().regex(/^\d{4,6}$/),
});

export const loginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(8),
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

export const authResponseSchema = z.object({
  user: authUserSchema,
  tokens: authTokensSchema,
});
