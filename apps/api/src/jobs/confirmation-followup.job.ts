import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfirmationService } from '../modules/confirmation/confirmation.service';

@Injectable()
export class ConfirmationFollowupJob {
  private readonly logger = new Logger(ConfirmationFollowupJob.name);

  constructor(private readonly confirmationService: ConfirmationService) {}

  @Cron('0 2 * * *')
  async handleAutoConfirmation() {
    const autoConfirmed = await this.confirmationService.autoConfirmStaleUnlocks();

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
  }
}
