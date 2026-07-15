/**
 * Purpose: One-shot +24h reminder for the mover-to-poster flywheel (spec
 * v1.2 section 4.6): movers who confirmed a move-in but did not post their
 * vacated unit get exactly one SMS with the earnings estimate, then silence.
 * Why important: the flywheel keeps supply growing per transaction; the
 * single-reminder rule ("never nag") is a product promise.
 * Used by: Nest scheduler (hourly cron), wired via JobsModule.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfirmationSide } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { RequestContextService } from '../common/request-context/request-context.service';
import { ListingSeedService } from '../modules/listing/listing-seed.service';
import { SystemConfigService } from '../modules/system-config/system-config.service';
import { UserService } from '../modules/user/user.service';
import { SmsService } from '../infrastructure/sms/sms.service';

const HOUR_IN_MS = 60 * 60 * 1000;
const REMINDER_AFTER_HOURS = 24;
const REMINDER_WINDOW_HOURS = 72;

@Injectable()
export class MoverPosterReminderJob {
  private readonly logger = new Logger(MoverPosterReminderJob.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly listingSeedService: ListingSeedService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
    private readonly systemConfig: SystemConfigService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Cron('30 * * * *')
  async handleReminders(now = new Date()) {
    return this.requestContext.runInternal(() => this.sendPendingReminders(now));
  }

  async sendPendingReminders(now: Date) {
    const candidates = await this.prismaService.confirmation.findMany({
      where: {
        side: ConfirmationSide.INCOMING_TENANT,
        posterPromptSmsAt: null,
        confirmedAt: {
          lt: new Date(now.getTime() - REMINDER_AFTER_HOURS * HOUR_IN_MS),
          // Old confirmations outside the window are left alone forever.
          gt: new Date(now.getTime() - REMINDER_WINDOW_HOURS * HOUR_IN_MS),
        },
      },
      select: {
        id: true,
        userId: true,
        confirmedAt: true,
        user: {
          select: {
            phoneNumberEncrypted: true,
          },
        },
        unlock: {
          select: {
            listing: {
              select: {
                monthlyRent: true,
              },
            },
          },
        },
      },
    });

    let sent = 0;
    const pricingConfig = await this.systemConfig.resolvePricingConfig();

    for (const confirmation of candidates) {
      const alreadyPosted = await this.prismaService.listing.findFirst({
        where: {
          userId: confirmation.userId,
          createdAt: {
            gt: confirmation.confirmedAt,
          },
        },
        select: {
          id: true,
        },
      });

      // Mark even skipped candidates so the job never reconsiders them.
      await this.prismaService.confirmation.update({
        where: {
          id: confirmation.id,
        },
        data: {
          posterPromptSmsAt: now,
        },
      });

      if (alreadyPosted || !confirmation.user.phoneNumberEncrypted) {
        continue;
      }

      const estimate = this.listingSeedService.estimateEarnings(
        confirmation.unlock.listing.monthlyRent,
        pricingConfig,
      );

      try {
        await this.smsService.sendMessage(
          this.userService.decryptPhoneNumber(confirmation.user.phoneNumberEncrypted),
          `Leaving a house behind? It's worth ~KES ${estimate.earningsKes} on PataSpace. Post it in 2 minutes from the app.`,
        );
        sent += 1;
      } catch {
        continue;
      }
    }

    if (sent > 0) {
      this.logger.log(
        JSON.stringify({
          event: 'job.mover-poster-reminder.summary',
          sent,
          at: now.toISOString(),
        }),
      );
    }

    return sent;
  }
}
