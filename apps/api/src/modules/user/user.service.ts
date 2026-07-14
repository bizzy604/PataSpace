/**
 * Purpose: User lookup, creation, and profile transformation for the user module.
 * Why important: Central source of truth for resolving a request principal to a DB record.
 * Used by: JwtStrategy, UserController, AuthService/RegistrationService/PasswordRecoveryService,
 *   and any module that needs user data.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Role as ContractRole, UserProfile } from '@pataspace/contracts';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import {
  decryptField,
  hashLookupValue,
  normalizePhoneNumber,
} from '../../common/security/encryption.util';

export const userSelect = {
  id: true,
  // Orphaned: no code path writes or reads Clerk identities anymore
  // (Docs/14 Phase 1). Column drops in Phase 4 after a clean-cutover check.
  clerkId: true,
  phoneNumberEncrypted: true,
  phoneVerified: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  isBanned: true,
  banReason: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
} as const;

export type StoredUser = {
  id: string;
  clerkId: string | null;
  phoneNumberEncrypted: string | null;
  phoneVerified: boolean;
  email: string | null;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

@Injectable()
export class UserService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
  }

  async findStoredById(userId: string) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  }

  async findStoredByPhoneNumber(phoneNumber: string) {
    return this.prismaService.user.findUnique({
      where: {
        phoneNumberHash: hashLookupValue(normalizePhoneNumber(phoneNumber)),
      },
      select: userSelect,
    });
  }

  async findStoredByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: userSelect,
    });
  }

  async getProfileOrThrow(userId: string): Promise<UserProfile> {
    const user = await this.findStoredById(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User profile was not found',
      });
    }
    return this.toUserProfile(user);
  }

  toAuthUser(user: StoredUser) {
    return {
      id: user.id,
      phoneNumber: user.phoneNumberEncrypted
        ? this.decryptPhoneNumber(user.phoneNumberEncrypted)
        : null,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as unknown as ContractRole,
      phoneVerified: user.phoneVerified,
      email: user.email,
    };
  }

  toUserProfile(user: StoredUser): UserProfile {
    return {
      ...this.toAuthUser(user),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  decryptPhoneNumber(phoneNumberEncrypted: string) {
    return decryptField(phoneNumberEncrypted, this.encryptionKey);
  }
}
