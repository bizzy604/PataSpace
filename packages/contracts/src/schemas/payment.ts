import { z } from 'zod';
import { TransactionStatus, TransactionType } from '../enums';
import { isoDateStringSchema, phoneNumberSchema } from './common';

export const creditBalanceSchema = z.object({
  balance: z.number().int().nonnegative(),
  lifetimeEarned: z.number().int().nonnegative(),
  lifetimeSpent: z.number().int().nonnegative(),
});

export const creditTransactionSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  amount: z.number().int(),
  status: z.nativeEnum(TransactionStatus),
  description: z.string().optional(),
  createdAt: isoDateStringSchema,
});

export const purchaseCreditsSchema = z.object({
  amount: z.number().int().positive(),
  phoneNumber: phoneNumberSchema,
});

export const purchaseCreditsResponseSchema = z.object({
  transactionId: z.string().min(1),
  status: z.nativeEnum(TransactionStatus),
});
