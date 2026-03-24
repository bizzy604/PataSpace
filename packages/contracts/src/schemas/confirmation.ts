import { z } from 'zod';
import { CommissionStatus, ConfirmationSide } from '../enums';
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

export const createConfirmationResponseSchema = z.object({
  confirmationId: z.string().min(1),
  unlockId: z.string().min(1),
  side: z.nativeEnum(ConfirmationSide),
  confirmedAt: isoDateStringSchema,
  bothConfirmed: z.boolean(),
  commission: confirmationCommissionSchema.optional(),
  message: z.string().min(1),
});

export const confirmationRecordSchema = createConfirmationResponseSchema;
