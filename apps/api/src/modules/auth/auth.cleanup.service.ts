import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async pruneExpiredOtps() {
    const now = new Date();
    const otpMaxAttempts = this.configService.get<number>('security.otpMaxAttempts') ?? 3;
    const deletedOtps = await this.prismaService.oTPCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { verified: true },
          { attempts: { gte: otpMaxAttempts } },
        ],
      },
    });

    if (deletedOtps.count > 0) {
      this.logger.log(
        JSON.stringify({
          event: 'job.auth-cleanup.otps',
          removedOtpCount: deletedOtps.count,
          at: now.toISOString(),
        }),
      );
    }
  }

  @Cron('0 4 * * *')
  async pruneExpiredRefreshTokens() {
    const now = new Date();
    const deletedRefreshTokens = await this.prismaService.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    if (deletedRefreshTokens.count > 0) {
      this.logger.log(
        JSON.stringify({
          event: 'job.auth-cleanup.refresh-tokens',
          removedRefreshTokenCount: deletedRefreshTokens.count,
          at: now.toISOString(),
        }),
      );
    }
  }
}
