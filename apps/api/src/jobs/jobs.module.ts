import { Module } from '@nestjs/common';
import { ConfirmationModule } from '../modules/confirmation/confirmation.module';
import { CreditModule } from '../modules/credit/credit.module';
import { PaymentModule } from '../modules/payment/payment.module';
import { UserModule } from '../modules/user/user.module';
import { CommissionPayoutJob } from './commission-payout.job';
import { ConfirmationFollowupJob } from './confirmation-followup.job';
import { ListingCleanupJob } from './listing-cleanup.job';
import { NotificationJob } from './notification.job';
import { PaymentReconciliationJob } from './payment-reconciliation.job';
import { ReferralRewardJob } from './referral-reward.job';

@Module({
  imports: [UserModule, PaymentModule, ConfirmationModule, CreditModule],
  providers: [
    CommissionPayoutJob,
    PaymentReconciliationJob,
    ConfirmationFollowupJob,
    ListingCleanupJob,
    NotificationJob,
    ReferralRewardJob,
  ],
  exports: [
    CommissionPayoutJob,
    PaymentReconciliationJob,
    ConfirmationFollowupJob,
    ListingCleanupJob,
    NotificationJob,
    ReferralRewardJob,
  ],
})
export class JobsModule {}
