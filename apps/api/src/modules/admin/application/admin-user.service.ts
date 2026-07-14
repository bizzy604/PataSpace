/**
 * Purpose: Admin user management — paginated directory, per-user detail, and
 *   ban/unban with audit logging and refresh-token revocation.
 * Why important: Banning is the platform's abuse lever; both auth strategies
 *   reject banned users, so this service is what actually locks an account.
 * Used by: AdminUsersController (modules/admin).
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  AdminUserActionResponse,
  AdminUserDetail,
  AdminUsersResponse,
  BanUserRequest,
} from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';
import { UserService } from '../../user/user.service';
import {
  AdminUserRow,
  AdminUsersQuery,
  buildUsersWhere,
  toUserSummary,
} from './admin-user.mapper';

@Injectable()
export class AdminUserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async listUsers(query: AdminUsersQuery): Promise<AdminUsersResponse> {
    const where = buildUsersWhere(query);
    const [total, users] = await Promise.all([
      this.prismaService.user.count({ where }),
      this.prismaService.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { _count: { select: { listings: true, unlocks: true } } },
      }),
    ]);

    return {
      data: users.map((user: AdminUserRow) => toUserSummary(user, this.userService)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        credit: { select: { balance: true } },
        _count: {
          select: { listings: true, unlocks: true, disputes: true, supportTickets: true },
        },
      },
    });

    if (!user) {
      throw this.userNotFound();
    }

    return {
      ...toUserSummary(user, this.userService),
      banReason: user.banReason,
      creditBalance: user.credit?.balance ?? 0,
      disputesCount: user._count.disputes,
      supportTicketsCount: user._count.supportTickets,
    };
  }

  async banUser(
    adminId: string,
    userId: string,
    input: BanUserRequest,
  ): Promise<AdminUserActionResponse> {
    const user = await this.getUserOrThrow(userId);

    if (userId === adminId) {
      throw new BadRequestException({
        code: 'CANNOT_BAN_SELF',
        message: 'Admins cannot ban their own account',
      });
    }

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException({
        code: 'CANNOT_BAN_ADMIN',
        message: 'Admin accounts cannot be banned from the console',
      });
    }

    if (user.isBanned) {
      throw new ConflictException({
        code: 'ALREADY_BANNED',
        message: 'This user is already banned',
      });
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false, isBanned: true, banReason: input.reason },
      });
      // Refresh tokens die immediately; the current access token (if any)
      // is rejected on its next request by JwtStrategy's isBanned check.
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'user.ban',
          entityType: 'User',
          entityId: userId,
          oldValue: { isActive: user.isActive, isBanned: false, banReason: user.banReason },
          newValue: { isActive: false, isBanned: true, banReason: input.reason },
        },
      });
    });

    return { id: userId, isBanned: true, message: 'User banned and sessions revoked' };
  }

  async unbanUser(adminId: string, userId: string): Promise<AdminUserActionResponse> {
    const user = await this.getUserOrThrow(userId);

    if (!user.isBanned) {
      throw new ConflictException({
        code: 'NOT_BANNED',
        message: 'This user is not banned',
      });
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true, isBanned: false, banReason: null },
      });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'user.unban',
          entityType: 'User',
          entityId: userId,
          oldValue: { isActive: user.isActive, isBanned: true, banReason: user.banReason },
          newValue: { isActive: true, isBanned: false, banReason: null },
        },
      });
    });

    return { id: userId, isBanned: false, message: 'User unbanned and reactivated' };
  }

  private async getUserOrThrow(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, isBanned: true, banReason: true },
    });

    if (!user) {
      throw this.userNotFound();
    }

    return user;
  }

  private userNotFound() {
    return new NotFoundException({
      code: 'USER_NOT_FOUND',
      message: 'User was not found',
    });
  }
}
