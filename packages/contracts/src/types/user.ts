import { Role } from '../enums';

export type UserProfile = {
  id: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  phoneVerified: boolean;
  email?: string;
  createdAt: string;
  updatedAt: string;
};

export type RequestPhoneVerificationRequest = {
  phoneNumber: string;
};

export type VerifyPhoneVerificationRequest = {
  phoneNumber: string;
  code: string;
};

export type PhoneVerificationRequestResponse = {
  message: string;
  expiresIn: number;
};
