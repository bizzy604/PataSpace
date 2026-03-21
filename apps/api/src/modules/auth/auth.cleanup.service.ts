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
  async pruneExpiredArtifacts() {
    const now = new Date();
    const otpMaxAttempts = this.configService.get<number>('security.otpMaxAttempts') ?? 3;

    const [deletedOtps, deletedRefreshTokens] = await Promise.all([
      this.prismaService.oTPCode.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { verified: true },
            { attempts: { gte: otpMaxAttempts } },
          ],
        },
      }),
      this.prismaService.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      }),
    ]);

    if (deletedOtps.count > 0 || deletedRefreshTokens.count > 0) {
      this.logger.log(
        `Removed ${deletedOtps.count} expired OTP records and ${deletedRefreshTokens.count} expired refresh tokens`,
      );
    }
  }
}
