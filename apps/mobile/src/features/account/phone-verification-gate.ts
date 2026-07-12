/**
 * Purpose: Pure decisions for the pre-submission phone-verification gate:
 * when the gate blocks submission, which step the card shows, and phone
 * input normalization to the API's +254XXXXXXXXX contract.
 * Why important: the API rejects listing submission (PHONE_NOT_VERIFIED)
 * until the account has a verified phone; these rules keep the client and
 * server telling the same story and stay unit-testable without React.
 * Used by: use-phone-verification, phone-verification-card, ListingReviewScreen.
 */
export type PhoneVerificationStatus = 'loading' | 'verified' | 'unverified' | 'unknown';

/**
 * Block while we positively know the phone is unverified, and during the
 * initial profile load (prevents a submit racing the check). 'unknown'
 * (profile fetch failed) does not block — the server re-checks on submit
 * and the 403 routes back into the card.
 */
export function phoneGateBlocksSubmit(status: PhoneVerificationStatus): boolean {
  return status === 'unverified' || status === 'loading';
}

export function isPhoneVerificationError(code: string): boolean {
  return code === 'PHONE_NOT_VERIFIED';
}

export type VerificationStep = 'hidden' | 'enter-phone' | 'enter-code';

export function verificationStepFor(
  status: PhoneVerificationStatus,
  codeRequested: boolean,
): VerificationStep {
  if (status !== 'unverified') {
    return 'hidden';
  }

  return codeRequested ? 'enter-code' : 'enter-phone';
}

/**
 * Folds common Kenyan input shapes (07XX…, 2547XX…, spaces/dashes) into the
 * +254XXXXXXXXX format the API contract requires. Returns null when the
 * input cannot be a valid Kenyan mobile number.
 */
export function normalizeKenyanPhoneInput(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, '');

  let candidate: string;
  if (digits.startsWith('+254')) {
    candidate = digits;
  } else if (digits.startsWith('254')) {
    candidate = `+${digits}`;
  } else if (digits.startsWith('0')) {
    candidate = `+254${digits.slice(1)}`;
  } else if (/^[17]\d{8}$/.test(digits)) {
    candidate = `+254${digits}`;
  } else {
    return null;
  }

  return /^\+254\d{9}$/.test(candidate) ? candidate : null;
}
