/**
 * Purpose: Wires all scheduled background jobs.
 * Why important: jobs close the loops users forget: auto-confirm, payouts,
 * cleanups, and the mover-to-poster reminder.
 * Used by: AppModule.
 */
import { Module } from '@nestjs/common';
import { ConfirmationModule } from '../modules/confirmation/confirmation.module';
import { CreditModule } from '../modules/credit/credit.module';
import { ListingModule } from '../modules/listing/listing.module';
import { PaymentModule } from '../modules/payment/payment.module';
import { UserModule } from '../modules/user/user.module';
import { CommissionPayoutJob } from './commission-payout.job';
import { CommissionPayoutProcessor } from './commission-payout.processor';
import { CommissionPayoutRecorder } from './commission-payout.recorder';
import { CommissionSettlementConfirmer } from './commission-settlement.confirmer';
import { ConfirmationFollowupJob } from './confirmation-followup.job';
import { ListingCleanupJob } from './listing-cleanup.job';
import { MoverPosterReminderJob } from './mover-poster-reminder.job';
import { NotificationJob } from './notification.job';
import { PaymentReconciliationJob } from './payment-reconciliation.job';
import { ReferralRewardJob } from './referral-reward.job';

@Module({
  imports: [UserModule, PaymentModule, ConfirmationModule, CreditModule, ListingModule],
  providers: [
    CommissionPayoutJob,
    CommissionPayoutProcessor,
    CommissionPayoutRecorder,
    CommissionSettlementConfirmer,
    PaymentReconciliationJob,
    ConfirmationFollowupJob,
    ListingCleanupJob,
    MoverPosterReminderJob,
    NotificationJob,
    ReferralRewardJob,
  ],
  exports: [
    CommissionPayoutJob,
    CommissionPayoutProcessor,
    PaymentReconciliationJob,
    ConfirmationFollowupJob,
    ListingCleanupJob,
    MoverPosterReminderJob,
    NotificationJob,
    ReferralRewardJob,
  ],
})
export class JobsModule {}
