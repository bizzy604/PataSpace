import { Role } from '../enums';

export type UserProfile = {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: Role;
  phoneVerified: boolean;
  email?: string;
  createdAt: string;
  updatedAt: string;
};
