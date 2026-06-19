/**
 * Purpose: Adapter over the Clerk backend SDK for administrative user actions
 *   (currently deleting a Clerk identity during account deletion).
 * Why important: Keeps the external Clerk integration behind a single seam so
 *   feature modules never construct the Clerk client directly.
 * Used by: AccountDeletionService (user module) to remove the Clerk identity
 *   when a user deletes their PataSpace account.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkAccountAdapter {
  private readonly logger = new Logger(ClerkAccountAdapter.name);
  private readonly clerk: ReturnType<typeof createClerkClient>;

  constructor(configService: ConfigService) {
    const secretKey = configService.get<string>('security.clerkSecretKey') ?? '';
    this.clerk = createClerkClient({ secretKey });
  }

  /**
   * Deletes the Clerk identity. A missing identity (already deleted) is treated
   * as success so it never blocks local data deletion.
   */
  async deleteUser(clerkId: string): Promise<void> {
    try {
      await this.clerk.users.deleteUser(clerkId);
    } catch (error) {
      if (this.isNotFound(error)) {
        this.logger.warn(`Clerk user ${clerkId} already absent; skipping`);
        return;
      }
      throw error;
    }
  }

  private isNotFound(error: unknown): boolean {
    return (error as { status?: number })?.status === 404;
  }
}
