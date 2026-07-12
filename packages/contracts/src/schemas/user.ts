import { z } from 'zod';
import { Role } from '../enums';
import { isoDateStringSchema, phoneNumberSchema } from './common';

export const userProfileSchema = z.object({
  id: z.string().min(1),
  phoneNumber: phoneNumberSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.nativeEnum(Role),
  phoneVerified: z.boolean(),
  email: z.string().email().optional(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const requestPhoneVerificationSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const verifyPhoneVerificationSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().regex(/^\d{4,6}$/),
});

export const phoneVerificationRequestResponseSchema = z.object({
  message: z.string().min(1),
  expiresIn: z.number().int().positive(),
});
