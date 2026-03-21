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
