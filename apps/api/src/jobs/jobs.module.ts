import { Module } from '@nestjs/common';
import { UserModule } from '../modules/user/user.module';
import { CommissionPayoutJob } from './commission-payout.job';
import { ListingCleanupJob } from './listing-cleanup.job';
import { NotificationJob } from './notification.job';

@Module({
  imports: [UserModule],
  providers: [CommissionPayoutJob, ListingCleanupJob, NotificationJob],
  exports: [CommissionPayoutJob, ListingCleanupJob, NotificationJob],
})
export class JobsModule {}
