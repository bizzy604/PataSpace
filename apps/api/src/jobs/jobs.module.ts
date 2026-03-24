import { Module } from '@nestjs/common';
import { ConfirmationModule } from '../modules/confirmation/confirmation.module';
import { PaymentModule } from '../modules/payment/payment.module';
import { UserModule } from '../modules/user/user.module';
import { CommissionPayoutJob } from './commission-payout.job';
import { ConfirmationFollowupJob } from './confirmation-followup.job';
import { ListingCleanupJob } from './listing-cleanup.job';
import { NotificationJob } from './notification.job';
import { PaymentReconciliationJob } from './payment-reconciliation.job';

@Module({
  imports: [UserModule, PaymentModule, ConfirmationModule],
  providers: [
    CommissionPayoutJob,
    PaymentReconciliationJob,
    ConfirmationFollowupJob,
    ListingCleanupJob,
    NotificationJob,
  ],
  exports: [
    CommissionPayoutJob,
    PaymentReconciliationJob,
    ConfirmationFollowupJob,
    ListingCleanupJob,
    NotificationJob,
  ],
})
export class JobsModule {}
