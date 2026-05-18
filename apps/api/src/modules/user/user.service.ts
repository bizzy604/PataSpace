/**
 * Purpose: User lookup, creation, and profile transformation for the user module.
 * Why important: Central source of truth for resolving a request principal to a DB record,
 *   supporting both phone-based (OTP) and Clerk SSO user creation paths.
 * Used by: JwtStrategy, ClerkJwtStrategy, UserController, and any module that needs user data.
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

const userSelect = {
  id: true,
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

  async findStoredByClerkId(clerkId: string) {
    return this.prismaService.user.findUnique({
      where: { clerkId },
      select: userSelect,
    });
  }

  async createFromClerk(data: {
    clerkId: string;
    email?: string;
    firstName: string;
    lastName: string;
  }): Promise<StoredUser> {
    // Upsert instead of create — guards against the TOCTOU race where concurrent
    // requests from the same first-time Clerk user all pass the findStoredByClerkId
    // check before any of them complete the insert, causing P2002 unique violations.
    return this.prismaService.user.upsert({
      where: { clerkId: data.clerkId },
      create: {
        clerkId: data.clerkId,
        email: data.email ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.USER,
        isActive: true,
        credit: { create: { balance: 0 } },
      },
      update: {},
      select: userSelect,
    });
  }

  async linkClerkId(userId: string, clerkId: string): Promise<StoredUser> {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { clerkId },
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
    };
  }

  toUserProfile(user: StoredUser): UserProfile {
    return {
      ...this.toAuthUser(user),
      email: user.email ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  decryptPhoneNumber(phoneNumberEncrypted: string) {
    return decryptField(phoneNumberEncrypted, this.encryptionKey);
  }
}
