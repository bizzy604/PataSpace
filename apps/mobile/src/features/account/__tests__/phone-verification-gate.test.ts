import {
  isPhoneVerificationError,
  normalizeKenyanPhoneInput,
  phoneGateBlocksSubmit,
  verificationStepFor,
} from '../phone-verification-gate';

describe('phoneGateBlocksSubmit', () => {
  it('blocks while unverified and during the initial load', () => {
    expect(phoneGateBlocksSubmit('unverified')).toBe(true);
    expect(phoneGateBlocksSubmit('loading')).toBe(true);
  });

  it('does not block verified users or unknown status (server re-checks)', () => {
    expect(phoneGateBlocksSubmit('verified')).toBe(false);
    expect(phoneGateBlocksSubmit('unknown')).toBe(false);
  });
});

describe('isPhoneVerificationError', () => {
  it('matches only the API PHONE_NOT_VERIFIED code', () => {
    expect(isPhoneVerificationError('PHONE_NOT_VERIFIED')).toBe(true);
    expect(isPhoneVerificationError('ACCOUNT_BANNED')).toBe(false);
    expect(isPhoneVerificationError('')).toBe(false);
  });
});

describe('verificationStepFor', () => {
  it('hides the card unless the account is positively unverified', () => {
    expect(verificationStepFor('verified', false)).toBe('hidden');
    expect(verificationStepFor('loading', false)).toBe('hidden');
    expect(verificationStepFor('unknown', true)).toBe('hidden');
  });

  it('walks from phone entry to code entry once a code is requested', () => {
    expect(verificationStepFor('unverified', false)).toBe('enter-phone');
    expect(verificationStepFor('unverified', true)).toBe('enter-code');
  });
});

describe('normalizeKenyanPhoneInput', () => {
  it('folds common Kenyan formats into +254XXXXXXXXX', () => {
    expect(normalizeKenyanPhoneInput('0712 345 678')).toBe('+254712345678');
    expect(normalizeKenyanPhoneInput('0110-234-567')).toBe('+254110234567');
    expect(normalizeKenyanPhoneInput('254712345678')).toBe('+254712345678');
    expect(normalizeKenyanPhoneInput('+254712345678')).toBe('+254712345678');
    expect(normalizeKenyanPhoneInput('712345678')).toBe('+254712345678');
  });

  it('rejects inputs that cannot be a Kenyan mobile number', () => {
    expect(normalizeKenyanPhoneInput('12345')).toBeNull();
    expect(normalizeKenyanPhoneInput('+14155550123')).toBeNull();
    expect(normalizeKenyanPhoneInput('07123')).toBeNull();
    expect(normalizeKenyanPhoneInput('not a phone')).toBeNull();
    expect(normalizeKenyanPhoneInput('')).toBeNull();
  });
});
