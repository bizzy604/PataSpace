import { Role } from '../enums';

export type UserProfile = {
  id: string;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  phoneVerified: boolean;
  emailVerified: boolean;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};
