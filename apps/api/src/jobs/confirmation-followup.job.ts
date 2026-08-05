/**
 * Purpose: Daily cron that auto-confirms unlocks where only one side ever
 * confirmed, so a silent counterparty cannot freeze a payout forever.
 * Why important: the sweep now settles through SettlementService, which also
 * locks the handed-over listing and refunds rival unlockers, so this job moves
 * real money and has to run under the privileged context.
 * Used by: JobsModule (registered cron, 02:00 daily).
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RequestContextService } from '../common/request-context/request-context.service';
import { StaleConfirmationService } from '../modules/confirmation/application/stale-confirmation.service';

@Injectable()
export class ConfirmationFollowupJob {
  private readonly logger = new Logger(ConfirmationFollowupJob.name);

  constructor(
    private readonly staleConfirmationService: StaleConfirmationService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Cron('0 2 * * *')
  async handleAutoConfirmation() {
    return this.requestContext.runInternal(async () => {
      const autoConfirmed = await this.staleConfirmationService.autoConfirmStaleUnlocks();

      if (autoConfirmed > 0) {
        this.logger.log(
          JSON.stringify({
            event: 'job.confirmation-followup.summary',
            autoConfirmed,
            at: new Date().toISOString(),
          }),
        );
      }

      return autoConfirmed;
    });
  }
}
