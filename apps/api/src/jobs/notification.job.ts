import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { SmsService } from '../infrastructure/sms/sms.service';
import { UserService } from '../modules/user/user.service';

@Injectable()
export class NotificationJob {
  private readonly logger = new Logger(NotificationJob.name);
  private readonly alertActions = ['commission.dead_lettered', 'listing.cleanup_failed'] as const;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
  ) {}

  @Cron('*/15 * * * *')
  async handleOperationalAlerts() {
    return this.dispatchOperationalAlerts();
  }

  async dispatchOperationalAlerts(now = new Date()) {
    const adminUsers = await this.prismaService.user.findMany({
      where: {
        role: Role.ADMIN,
        isActive: true,
        isBanned: false,
      },
      select: {
        id: true,
        phoneNumberEncrypted: true,
      },
    });

    const failureAudits = await this.prismaService.auditLog.findMany({
      where: {
        action: {
          in: [...this.alertActions],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50,
    });

    const summary = {
      candidates: failureAudits.length,
      sent: 0,
      skippedNoAdmins: 0,
      skippedAlreadySent: 0,
      failed: 0,
    };

    for (const failureAudit of failureAudits) {
      const alreadySent = await this.prismaService.auditLog.findFirst({
        where: {
          action: 'notification.background_alert_sent',
          entityType: 'AuditLog',
          entityId: failureAudit.id,
        },
        select: {
          id: true,
        },
      });

      if (alreadySent) {
        summary.skippedAlreadySent += 1;
        continue;
      }

      if (adminUsers.length === 0) {
        summary.skippedNoAdmins += 1;
        continue;
      }

      const message = this.buildAlertMessage(failureAudit);
      let sentCount = 0;

      for (const adminUser of adminUsers) {
        try {
          await this.smsService.sendMessage(
            this.userService.decryptPhoneNumber(adminUser.phoneNumberEncrypted),
            message,
          );
          sentCount += 1;
        } catch {
          continue;
        }
      }

      if (sentCount === 0) {
        summary.failed += 1;
        continue;
      }

      await this.prismaService.auditLog.create({
        data: {
          action: 'notification.background_alert_sent',
          entityType: 'AuditLog',
          entityId: failureAudit.id,
          metadata: {
            sourceAction: failureAudit.action,
            notifiedAdminCount: sentCount,
            sentAt: now.toISOString(),
          } satisfies Prisma.InputJsonObject,
        },
      });

      summary.sent += 1;
    }

    this.logger.log(
      JSON.stringify({
        event: 'job.notification.summary',
        ...summary,
        at: now.toISOString(),
      }),
    );

    return summary;
  }

  private buildAlertMessage(failureAudit: {
    action: string;
    entityType: string;
    entityId: string;
    metadata: Prisma.JsonValue | null;
  }) {
    const metadata = this.asRecord(failureAudit.metadata);

    if (failureAudit.action === 'commission.dead_lettered') {
      return `PataSpace alert: commission ${failureAudit.entityId} failed after ${metadata.paymentAttempts ?? 'multiple'} attempts.`;
    }

    if (failureAudit.action === 'listing.cleanup_failed') {
      return `PataSpace alert: listing cleanup failed for ${failureAudit.entityId}.`;
    }

    return `PataSpace background alert: ${failureAudit.action} on ${failureAudit.entityType} ${failureAudit.entityId}.`;
  }

  private asRecord(value: Prisma.JsonValue | null) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {} as Record<string, unknown>;
    }

    return value as Record<string, unknown>;
  }
}
