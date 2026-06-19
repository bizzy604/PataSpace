/**
 * Purpose: Orchestrates permanent deletion of a user's PataSpace account — removes
 *   the Clerk identity and the local user record (cascading all owned data).
 * Why important: Apple (Guideline 5.1.1(v)) and Google Play require an in-app
 *   account-deletion path; this is the server-side action behind that flow.
 * Used by: UserController's DELETE /users/me route.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { ClerkAccountAdapter } from '../../infrastructure/clerk/clerk-account.adapter';
import { UserService } from './user.service';

@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkAccount: ClerkAccountAdapter,
    private readonly userService: UserService,
  ) {}

  /**
   * Deletes the Clerk identity first (so the user cannot re-authenticate
   * mid-deletion), then the local record. FK `onDelete: Cascade` removes all
   * owned rows (listings, credits, unlocks, …); audit logs are retained with a
   * null user reference.
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userService.findStoredById(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User profile was not found',
      });
    }

    if (user.clerkId) {
      await this.clerkAccount.deleteUser(user.clerkId);
    }

    await this.prisma.user.delete({ where: { id: userId } });
    this.logger.log(`Deleted account ${userId}`);
  }
}
