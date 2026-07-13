/**
 * Purpose: Gate-test the email-identifier auth schemas (Docs/14 Phase 0).
 * Why important: These schemas become the register/login contract for all
 *   three apps after Clerk removal; a silent loosening (weak password
 *   accepted, malformed email passing, OTP shape drift) is an auth bug in
 *   every client at once.
 * Used by: `pnpm --filter @pataspace/contracts test`.
 */
import {
  authSessionSchema,
  authUserSchema,
  emailLoginSchema,
  emailRegisterSchema,
  forgotPasswordResponseSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../auth';
import { Role } from '../../enums';

const validRegister = {
  email: 'Amoni@Example.com',
  password: 'Str0ng!pass',
  firstName: 'Amoni',
  lastName: 'Kevin',
  phoneNumber: '+254712345678',
};

describe('emailRegisterSchema', () => {
  it('accepts a valid registration and normalizes the email', () => {
    const parsed = emailRegisterSchema.parse(validRegister);
    expect(parsed.email).toBe('amoni@example.com');
  });

  it.each([
    ['missing email', { ...validRegister, email: undefined }],
    ['malformed email', { ...validRegister, email: 'not-an-email' }],
    ['missing phone', { ...validRegister, phoneNumber: undefined }],
    ['short password', { ...validRegister, password: 'S1!a' }],
    ['no uppercase', { ...validRegister, password: 'str0ng!pass' }],
    ['no number', { ...validRegister, password: 'Strong!pass' }],
    ['no special char', { ...validRegister, password: 'Str0ngpass' }],
  ])('rejects %s', (_label, input) => {
    expect(emailRegisterSchema.safeParse(input).success).toBe(false);
  });
});

describe('emailLoginSchema', () => {
  it('accepts email + password and normalizes the email', () => {
    const parsed = emailLoginSchema.parse({
      email: '  User@Example.com ',
      password: 'Str0ng!pass',
    });
    expect(parsed.email).toBe('user@example.com');
  });

  it('rejects a phone number in place of an email', () => {
    expect(
      emailLoginSchema.safeParse({ email: '+254712345678', password: 'Str0ng!pass' }).success,
    ).toBe(false);
  });
});

describe('forgot/reset password schemas', () => {
  it('forgotPassword takes only an email', () => {
    expect(forgotPasswordSchema.parse({ email: 'a@b.co' }).email).toBe('a@b.co');
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });

  it('forgotPassword response shape carries no account-existence signal', () => {
    const parsed = forgotPasswordResponseSchema.parse({ message: 'OTP sent', expiresIn: 300 });
    expect(Object.keys(parsed).sort()).toEqual(['expiresIn', 'message']);
  });

  it('resetPassword requires the OTP shape shared with verify-otp', () => {
    const base = { email: 'a@b.co', newPassword: 'Str0ng!pass' };
    expect(resetPasswordSchema.safeParse({ ...base, code: '123456' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...base, code: '12' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...base, code: 'abcdef' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...base, newPassword: 'weak' }).success).toBe(false);
  });
});

describe('backward compatibility (Phase 0 is additive)', () => {
  const legacySession = {
    accessToken: 'a'.repeat(10),
    refreshToken: 'r'.repeat(10),
    user: {
      id: 'user-1',
      phoneNumber: '+254712345678',
      firstName: 'Amoni',
      lastName: 'Kevin',
      role: Role.USER,
      phoneVerified: true,
    },
  };

  it('phone-identifier register/login schemas still parse (API still on them)', () => {
    expect(
      registerSchema.safeParse({
        phoneNumber: '+254712345678',
        password: 'Str0ng!pass',
        firstName: 'Amoni',
        lastName: 'Kevin',
      }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ phoneNumber: '+254712345678', password: 'Str0ng!pass' }).success,
    ).toBe(true);
  });

  it('a session without an email still parses; with one it parses too', () => {
    expect(authSessionSchema.safeParse(legacySession).success).toBe(true);
    expect(
      authUserSchema.safeParse({ ...legacySession.user, email: 'a@b.co' }).success,
    ).toBe(true);
    expect(
      authUserSchema.safeParse({ ...legacySession.user, email: null }).success,
    ).toBe(true);
  });
});
