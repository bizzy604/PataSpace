/**
 * Purpose: Zod schema validating the save-listing request payload.
 * Why important: Centralises the validation rule (a non-empty listing id) so
 *   the API and clients share it.
 * Used by: apps/api saved-listing module (zod validation pipe).
 */
import { z } from 'zod';

export const saveListingSchema = z.object({
  listingId: z.string().min(1),
});
