import { z } from 'zod';
import { DisputeStatus } from '../enums';
import { isoDateStringSchema } from './common';

export const createDisputeSchema = z.object({
  unlockId: z.string().min(1),
  reason: z.string().min(10),
  evidence: z.array(z.string().url()).default([]),
});

export const resolveDisputeActionSchema = z.enum(['NO_REFUND', 'FULL_REFUND']);

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(10),
  action: resolveDisputeActionSchema,
});

export const createDisputeResponseSchema = z.object({
  disputeId: z.string().min(1),
  status: z.nativeEnum(DisputeStatus),
  message: z.string().min(1),
  estimatedResolution: z.string().min(1),
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
  refundAmount: z.number().int().nonnegative().optional(),
});
