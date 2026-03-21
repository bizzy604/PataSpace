import { Role } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  role: Role;
  phoneNumber?: string | null;
  phoneVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
};

export type AuthenticatedRequest = {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method?: string;
  requestId?: string;
  route?: {
    path?: string;
  };
  url: string;
  user?: AuthenticatedUser;
};
