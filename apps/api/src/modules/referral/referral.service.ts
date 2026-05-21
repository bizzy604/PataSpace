/**
 * Purpose: Application service for referrals — creates invites, lists the
 *   referrer's history, and links a joining user back to the original invite.
 * Why important: Provides the data layer for the invite-friends loop so
 *   credit-reward accounting (INVITED → JOINED → REWARDED) can run later
 *   in a job; without it the referral CTA is meaningless.
 * Used by: ReferralController.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, ReferralStatus as PrismaReferralStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  CreateReferralRequest,
  CreateReferralResponse,
  PaginatedReferralsResponse,
  ReferralRecord,
  ReferralStatus as ContractReferralStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import {
  hashLookupValue,
  normalizePhoneNumber,
} from '../../common/security/encryption.util';

@Injectable()
export class ReferralService {
  constructor(private readonly prismaService: PrismaService) {}

  async createReferral(
    referrerId: string,
    input: CreateReferralRequest,
  ): Promise<CreateReferralResponse> {
    const normalized = normalizePhoneNumber(input.phoneNumber);
    const inviteePhoneHash = hashLookupValue(normalized);
    const inviteePhoneMasked = this.maskPhone(normalized);

    const referrerPhone = await this.prismaService.user.findUnique({
      where: { id: referrerId },
      select: { phoneNumberHash: true },
    });
    if (referrerPhone?.phoneNumberHash === inviteePhoneHash) {
      throw new BadRequestException({
        code: 'CANNOT_REFER_SELF',
        message: 'You cannot refer yourself',
      });
    }

    try {
      const referral = await this.prismaService.referral.create({
        data: {
          referrerId,
          inviteePhoneHash,
          inviteePhoneMasked,
          code: this.generateCode(),
        },
      });
      return this.toRecord(referral);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'REFERRAL_ALREADY_SENT',
          message: 'You have already invited this number',
        });
      }
      throw error;
    }
  }

  /**
   * Marks any INVITED referrals for this phone hash as JOINED with the
   * verified user attached. Returns the number of rows linked (0 or 1 in
   * practice — the unique index on (referrerId, inviteePhoneHash) keeps a
   * tenant from being double-invited by the same referrer, and we only
   * promote rows that are still in INVITED state).
   */
  async linkPendingReferral(phoneNumberHash: string, refereeUserId: string) {
    const result = await this.prismaService.referral.updateMany({
      where: {
        inviteePhoneHash: phoneNumberHash,
        status: PrismaReferralStatus.INVITED,
        refereeUserId: null,
        NOT: { referrerId: refereeUserId },
      },
      data: {
        status: PrismaReferralStatus.JOINED,
        refereeUserId,
        joinedAt: new Date(),
      },
    });
    return result.count;
  }

  async listMyReferrals(
    referrerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedReferralsResponse> {
    const skip = (page - 1) * limit;
    const where = { referrerId } satisfies Prisma.ReferralWhereInput;

    const [total, referrals] = await this.prismaService.$transaction([
      this.prismaService.referral.count({ where }),
      this.prismaService.referral.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: referrals.map((referral) => this.toRecord(referral)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: totalPages > 0 && page < totalPages,
        hasPrev: totalPages > 0 && page > 1,
      },
    };
  }

  private toRecord(referral: {
    id: string;
    code: string;
    inviteePhoneMasked: string;
    status: PrismaReferralStatus;
    joinedAt: Date | null;
    rewardedAt: Date | null;
    createdAt: Date;
  }): ReferralRecord {
    return {
      id: referral.id,
      code: referral.code,
      inviteePhoneMasked: referral.inviteePhoneMasked,
      status: referral.status as unknown as ContractReferralStatus,
      joinedAt: referral.joinedAt?.toISOString() ?? null,
      rewardedAt: referral.rewardedAt?.toISOString() ?? null,
      createdAt: referral.createdAt.toISOString(),
    };
  }

  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    const tail = phone.slice(-3);
    return `${phone.slice(0, 4)}***${tail}`;
  }
}
