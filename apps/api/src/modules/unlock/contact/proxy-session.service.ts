/**
 * Purpose: Masked contact layer (spec v1.2 section 4.5): allocates a pooled
 * virtual number per unlock, tracks session lifecycle, and resolves the
 * contact payload (masked vs legacy direct reveal).
 * Why important: posters hand their location and contact to strangers;
 * masking is a safety feature, prevents off-platform leakage, and yields
 * response telemetry. Falls back to direct reveal until a number pool exists.
 * Used by: UnlockService (create/read), UnlockRefundService (expiry),
 * ConfirmationService (post-capture extension), VoiceWebhookController.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ProxySessionStatus } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export type ContactMaskingConfig = {
  maskingEnabled: boolean;
  virtualNumbers: string[];
  sessionTtlHours: number;
  postCaptureTtlDays: number;
};

export type ProxySessionSummary = {
  virtualMsisdn: string;
  expiresAt: Date;
};

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ProxySessionService {
  private readonly config: ContactMaskingConfig;

  constructor(
    private readonly prismaService: PrismaService,
    configService: ConfigService,
  ) {
    this.config = configService.get<ContactMaskingConfig>('contact') ?? {
      maskingEnabled: false,
      virtualNumbers: [],
      sessionTtlHours: 72,
      postCaptureTtlDays: 7,
    };
  }

  get maskingEnabled(): boolean {
    return this.config.maskingEnabled && this.config.virtualNumbers.length > 0;
  }

  async createForUnlock(db: DbClient, unlockId: string): Promise<ProxySessionSummary | null> {
    if (!this.maskingEnabled) {
      return null;
    }

    const virtualMsisdn = await this.pickLeastLoadedNumber(db);
    const expiresAt = new Date(Date.now() + this.config.sessionTtlHours * HOUR_IN_MS);

    const session = await db.proxySession.create({
      data: {
        unlockId,
        virtualMsisdn,
        expiresAt,
      },
      select: {
        virtualMsisdn: true,
        expiresAt: true,
      },
    });

    return session;
  }

  async getActiveForUnlock(unlockId: string): Promise<ProxySessionSummary | null> {
    if (!this.maskingEnabled) {
      return null;
    }

    return this.prismaService.proxySession.findFirst({
      where: {
        unlockId,
        status: ProxySessionStatus.ACTIVE,
      },
      select: {
        virtualMsisdn: true,
        expiresAt: true,
      },
    });
  }

  async expireForUnlock(db: DbClient, unlockId: string): Promise<void> {
    await db.proxySession.updateMany({
      where: {
        unlockId,
        status: ProxySessionStatus.ACTIVE,
      },
      data: {
        status: ProxySessionStatus.EXPIRED,
        expiresAt: new Date(),
      },
    });
  }

  // Confirmed move-ins keep the line open for a post-capture grace window
  // (default 7 days) so key handover logistics stay in-platform.
  async extendForConfirmedUnlock(unlockId: string): Promise<void> {
    await this.prismaService.proxySession.updateMany({
      where: {
        unlockId,
        status: ProxySessionStatus.ACTIVE,
      },
      data: {
        expiresAt: new Date(Date.now() + this.config.postCaptureTtlDays * DAY_IN_MS),
      },
    });
  }

  async recordInboundCall(sessionId: string, isPosterCaller: boolean): Promise<void> {
    const now = new Date();

    await this.prismaService.proxySession.update({
      where: {
        id: sessionId,
      },
      data: {
        callCount: {
          increment: 1,
        },
        lastCallAt: now,
      },
    });

    if (isPosterCaller) {
      // Response telemetry: only the FIRST poster response matters, so never
      // overwrite an existing timestamp.
      await this.prismaService.proxySession.updateMany({
        where: {
          id: sessionId,
          firstPosterResponseAt: null,
        },
        data: {
          firstPosterResponseAt: now,
        },
      });
    }
  }

  async findRoutableSession(virtualMsisdn: string) {
    return this.prismaService.proxySession.findFirst({
      where: {
        virtualMsisdn,
        status: ProxySessionStatus.ACTIVE,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        firstPosterResponseAt: true,
        unlock: {
          select: {
            buyer: {
              select: {
                phoneNumberEncrypted: true,
              },
            },
            listing: {
              select: {
                user: {
                  select: {
                    phoneNumberEncrypted: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async pickLeastLoadedNumber(db: DbClient): Promise<string> {
    const activeCounts = await db.proxySession.groupBy({
      by: ['virtualMsisdn'],
      where: {
        status: ProxySessionStatus.ACTIVE,
        virtualMsisdn: {
          in: this.config.virtualNumbers,
        },
      },
      _count: {
        _all: true,
      },
    });
    const countByNumber = new Map(
      activeCounts.map((entry) => [entry.virtualMsisdn, entry._count._all]),
    );

    return [...this.config.virtualNumbers].sort(
      (left, right) =>
        (countByNumber.get(left) ?? 0) - (countByNumber.get(right) ?? 0) ||
        left.localeCompare(right),
    )[0];
  }
}
