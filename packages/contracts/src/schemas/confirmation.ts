import { z } from 'zod';
import { CommissionStatus, ConfirmationSide, SuccessFeeStatus } from '../enums';
import { isoDateStringSchema } from './common';

export const createConfirmationSchema = z.object({
  unlockId: z.string().min(1),
  side: z.nativeEnum(ConfirmationSide),
});

export const confirmationCommissionSchema = z.object({
  amount: z.number().int().nonnegative(),
  status: z.nativeEnum(CommissionStatus),
  payableOn: isoDateStringSchema,
});

export const confirmationSuccessFeeSchema = z.object({
  feeDueKes: z.number().int().nonnegative(),
  creditsApplied: z.number().int().nonnegative(),
  cashCollectedKes: z.number().int().nonnegative(),
  remainingKes: z.number().int().nonnegative(),
  status: z.nativeEnum(SuccessFeeStatus),
});

// Mover->poster flywheel prompt (spec section 4.6): shown on the success
// screen right after a confirmed move-in.
export const vacatedListingPromptSchema = z.object({
  seededFromConfirmationId: z.string().min(1),
  estimatedEarningsKes: z.number().int().nonnegative(),
  message: z.string().min(1),
});

export const createConfirmationResponseSchema = z.object({
  confirmationId: z.string().min(1),
  unlockId: z.string().min(1),
  side: z.nativeEnum(ConfirmationSide),
  confirmedAt: isoDateStringSchema,
  bothConfirmed: z.boolean(),
  commission: confirmationCommissionSchema.optional(),
  successFee: confirmationSuccessFeeSchema.optional(),
  vacatedListingPrompt: vacatedListingPromptSchema.optional(),
  message: z.string().min(1),
});

export const confirmationRecordSchema = createConfirmationResponseSchema;

export const settleSuccessFeeSchema = z.object({
  unlockId: z.string().min(1),
});

export const settleSuccessFeeResponseSchema = z.object({
  unlockId: z.string().min(1),
  feeDueKes: z.number().int().nonnegative(),
  creditsApplied: z.number().int().nonnegative(),
  cashCollectedKes: z.number().int().nonnegative(),
  remainingKes: z.number().int().nonnegative(),
  status: z.nativeEnum(SuccessFeeStatus),
  newBalance: z.number().int().nonnegative(),
  message: z.string().min(1),
});
