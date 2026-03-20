import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CommissionPayoutJob {
  private readonly logger = new Logger(CommissionPayoutJob.name);

  handle() {
    this.logger.log('Commission payout job scaffold ready.');
  }
}
