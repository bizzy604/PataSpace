/**
 * Purpose: Orchestrates permanent deletion of a user's PataSpace account.
 * Why important: Apple (Guideline 5.1.1(v)) and Google Play require an in-app
 *   account-deletion path; this is the server-side action behind that flow.
 * Used by: UserController's DELETE /users/me route.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { UserService } from './user.service';

@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /** FK `onDelete: Cascade` removes all owned rows (listings, credits, unlocks, …); audit logs are retained with a null user reference. */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userService.findStoredById(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User profile was not found',
      });
    }

    await this.prisma.user.delete({ where: { id: userId } });
    this.logger.log(`Deleted account ${userId}`);
  }
}
