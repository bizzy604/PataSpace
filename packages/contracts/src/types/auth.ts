import { Role } from '../enums';

export type AuthUser = {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: Role;
  phoneVerified: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

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

export type LoginRequest = {
  phoneNumber: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};
