/**
 * Purpose: Gate-test the email-identifier auth schemas (Docs/14 Phase 1).
 * Why important: These schemas are the register/login contract for all
 *   three apps after Clerk removal; a silent loosening (weak password
 *   accepted, malformed email passing, OTP shape drift) is an auth bug in
 *   every client at once.
 * Used by: `pnpm --filter @pataspace/contracts test`.
 */
import {
  authSessionSchema,
  authUserSchema,
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

describe('registerSchema (email-identifier)', () => {
  it('accepts a valid registration and normalizes the email', () => {
    const parsed = registerSchema.parse(validRegister);
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
    expect(registerSchema.safeParse(input).success).toBe(false);
  });
});

describe('loginSchema (email-identifier)', () => {
  it('accepts email + password and normalizes the email', () => {
    const parsed = loginSchema.parse({
      email: '  User@Example.com ',
      password: 'Str0ng!pass',
    });
    expect(parsed.email).toBe('user@example.com');
  });

  it('rejects a phone number in place of an email', () => {
    expect(
      loginSchema.safeParse({ email: '+254712345678', password: 'Str0ng!pass' }).success,
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

describe('authUserSchema / authSessionSchema', () => {
  const baseUser = {
    id: 'user-1',
    phoneNumber: '+254712345678',
    firstName: 'Amoni',
    lastName: 'Kevin',
    role: Role.USER,
    phoneVerified: true,
  };

  it('email is required in the shape but may be null (pre-migration accounts)', () => {
    expect(authUserSchema.safeParse({ ...baseUser, email: 'a@b.co' }).success).toBe(true);
    expect(authUserSchema.safeParse({ ...baseUser, email: null }).success).toBe(true);
    expect(authUserSchema.safeParse(baseUser).success).toBe(false);
  });

  it('a full session parses with an emailed user', () => {
    const session = {
      accessToken: 'a'.repeat(10),
      refreshToken: 'r'.repeat(10),
      user: { ...baseUser, email: 'a@b.co' },
    };
    expect(authSessionSchema.safeParse(session).success).toBe(true);
  });
});
