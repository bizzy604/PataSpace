/**
 * Purpose: Zod schemas validating referral request payloads.
 * Why important: Normalises phone-number input and enforces the contract on
 *   both the API boundary and the client form.
 * Used by: apps/api referral module, mobile referral form.
 */
import { z } from 'zod';

export const createReferralSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?\d{7,15}$|^0\d{9,14}$/, 'Phone number is not in a recognised format'),
});
