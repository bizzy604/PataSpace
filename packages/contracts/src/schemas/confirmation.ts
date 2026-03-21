import { z } from 'zod';
import { ConfirmationSide } from '../enums';
import { isoDateStringSchema } from './common';

export const createConfirmationSchema = z.object({
  unlockId: z.string().min(1),
  side: z.nativeEnum(ConfirmationSide),
});

export const confirmationRecordSchema = z.object({
  confirmationId: z.string().min(1),
  unlockId: z.string().min(1),
  side: z.nativeEnum(ConfirmationSide),
  confirmedAt: isoDateStringSchema,
});
