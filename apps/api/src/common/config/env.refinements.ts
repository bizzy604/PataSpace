/**
 * Purpose: Shared zod refinement helpers for environment validation.
 * Why important: Keeps env.validation.ts under the file-size budget while the
 *   provider-specific rules grow; one place for "field required" and "must be
 *   HTTPS" checks.
 * Used by: env.validation.ts (envSchema superRefine).
 */
import { z } from 'zod';

export function requireFields(
  context: z.RefinementCtx,
  value: Record<string, string | number | undefined>,
  fields: string[],
) {
  for (const field of fields) {
    if (value[field] !== undefined && value[field] !== '') {
      continue;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [field],
      message: `${field} is required for the selected provider configuration.`,
    });
  }
}

export function requireHttps(
  context: z.RefinementCtx,
  value: string | undefined,
  field: string,
) {
  if (!value) {
    return;
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.protocol === 'https:') {
      return;
    }
  } catch {
    return;
  }

  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: [field],
    message: `${field} must use HTTPS in the selected environment.`,
  });
}
