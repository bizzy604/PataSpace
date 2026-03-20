import { z } from 'zod';

export const registerSchema = z.object({
  phoneNumber: z.string().min(10),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export const loginSchema = z.object({
  phoneNumber: z.string().min(10),
  password: z.string().min(8),
});
