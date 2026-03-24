import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentService } from '../modules/payment/payment.service';

@Injectable()
export class PaymentReconciliationJob {
  private readonly logger = new Logger(PaymentReconciliationJob.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Cron('*/5 * * * *')
  async handlePendingPurchaseReconciliation() {
    const reconciled = await this.paymentService.reconcilePendingPurchases();

    if (reconciled > 0) {
      this.logger.log(
        JSON.stringify({
          event: 'job.payment-reconciliation.summary',
          reconciled,
          at: new Date().toISOString(),
        }),
      );
    }

    return reconciled;
  }
}
