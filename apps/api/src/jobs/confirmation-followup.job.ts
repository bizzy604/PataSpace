import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RequestContextService } from '../common/request-context/request-context.service';
import { ConfirmationService } from '../modules/confirmation/confirmation.service';

@Injectable()
export class ConfirmationFollowupJob {
  private readonly logger = new Logger(ConfirmationFollowupJob.name);

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Cron('0 2 * * *')
  async handleAutoConfirmation() {
    return this.requestContext.runInternal(async () => {
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
    });
  }
}
