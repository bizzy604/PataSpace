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

// The routes PaymentWebhookController actually registers. A URL pointing
// anywhere else means Safaricom posts into a 404 and the payment state
// machine silently starves (real incident: templates shipped /mpesa-result).
const MPESA_CALLBACK_PATHS = {
  MPESA_CALLBACK_URL: '/payments/mpesa-callback',
  MPESA_RESULT_URL: '/payments/mpesa-b2c-callback',
  MPESA_TIMEOUT_URL: '/payments/mpesa-b2c-timeout',
} as const;

export function requireMpesaCallbackContracts(
  context: z.RefinementCtx,
  value: {
    MPESA_CALLBACK_URL?: string;
    MPESA_RESULT_URL?: string;
    MPESA_TIMEOUT_URL?: string;
    MPESA_CALLBACK_SECRET?: string;
  },
) {
  for (const [field, expectedPath] of Object.entries(MPESA_CALLBACK_PATHS) as Array<
    [keyof typeof MPESA_CALLBACK_PATHS, string]
  >) {
    const raw = value[field];

    if (!raw) {
      continue;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(raw);
    } catch {
      continue; // the url() schema check already reports malformed values
    }

    if (!parsedUrl.pathname.endsWith(expectedPath)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} must end with ${expectedPath} (the registered webhook route); Daraja would otherwise post into a 404 and payments would silently stall.`,
      });
    }

    // Safaricom cannot send custom headers, so when callback auth is
    // configured the query token is the only credential that can arrive.
    if (
      value.MPESA_CALLBACK_SECRET &&
      parsedUrl.searchParams.get('token') !== value.MPESA_CALLBACK_SECRET
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} must include ?token=<MPESA_CALLBACK_SECRET>; without it every Safaricom callback is rejected with 401.`,
      });
    }
  }
}
