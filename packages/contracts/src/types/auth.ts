import { Role } from '../enums';

export type AuthUser = {
  id: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  phoneVerified: boolean;
  // Optional until the email-identifier migration (Docs/14) Phase 1
  // populates it server-side.
  email?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterResponse = {
  userId: string;
  message: string;
  expiresIn: number;
};

export type ResendOtpResponse = RegisterResponse;

export type RegisterRequest = {
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
};

export type VerifyOtpRequest = {
  phoneNumber: string;
  code: string;
};

export type ResendOtpRequest = {
  phoneNumber: string;
};

export type LoginRequest = {
  phoneNumber: string;
  password: string;
};

/*
 * Email-identifier auth (Clerk removal, Docs/14 Phase 0). Additive: Phase 1
 * makes these the canonical register/login shapes and removes the phone
 * login variant above.
 */
export type EmailRegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type EmailLoginRequest = {
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
  expiresIn: number;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshResponse = AuthTokens;
