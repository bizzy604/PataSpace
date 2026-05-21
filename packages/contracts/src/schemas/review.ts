/**
 * Purpose: Zod schemas validating unlock-review request payloads.
 * Why important: Enforces 1–5 ratings and a max comment length both at the
 *   API boundary and inside any client that wants to validate before submit.
 * Used by: apps/api review module, web/mobile review forms.
 */
import { z } from 'zod';

export const createReviewSchema = z.object({
  unlockId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
