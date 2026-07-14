import { Role } from '../enums';

export type AuthUser = {
  id: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  phoneVerified: boolean;
  // Nullable: every account has an email post Clerk-removal, but accounts
  // created before this migration may still have none.
  email: string | null;
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
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type VerifyOtpRequest = {
  phoneNumber: string;
  code: string;
};

export type ResendOtpRequest = {
  phoneNumber: string;
};

export type LoginRequest = {
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
