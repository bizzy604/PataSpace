import { z } from 'zod';
import { DisputeStatus } from '../enums';
import { isoDateStringSchema } from './common';

export const createDisputeSchema = z.object({
  unlockId: z.string().min(1),
  reason: z.string().min(10),
  evidence: z.array(z.string().url()).default([]),
});

export const disputeRecordSchema = z.object({
  id: z.string().min(1),
  unlockId: z.string().min(1),
  status: z.nativeEnum(DisputeStatus),
  reason: z.string().min(1),
  evidence: z.array(z.string().url()),
  resolution: z.string().optional(),
  createdAt: isoDateStringSchema,
  resolvedAt: isoDateStringSchema.optional(),
});
