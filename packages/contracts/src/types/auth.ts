import { Role } from '../enums';

export type AuthUser = {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  role: Role;
  phoneVerified: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
