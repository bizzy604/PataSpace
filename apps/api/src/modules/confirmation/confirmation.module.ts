/**
 * Purpose: Wires the confirmation module: the manual confirmation loop,
 * settlement, the 14-day stale sweep, the both-sides-confirmed listing
 * handover, success-fee settlement, and the SMS notifier.
 * Why important: this module owns the payout trigger and the listing lock; its
 * exports are consumed by disputes and background jobs.
 * Used by: AppModule, DisputeModule, JobsModule.
 */
import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module';
import { ListingModule } from '../listing/listing.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { UnlockModule } from '../unlock/unlock.module';
import { UserModule } from '../user/user.module';
import { SettlementService } from './application/settlement.service';
import { StaleConfirmationService } from './application/stale-confirmation.service';
import { ConfirmationController } from './confirmation.controller';
import { ConfirmationNotifierService } from './confirmation-notifier.service';
import { ConfirmationService } from './confirmation.service';
import { ListingHandoverService } from './listing-handover.service';
import { ConfirmationRepository } from './persistence/confirmation.repository';
import { SuccessFeeSettlementService } from './success-fee-settlement.service';
import { SuccessFeeService } from './success-fee.service';

@Module({
  // ListingModule is here for ListingCacheService, which the handover uses to
  // stop the browse feed advertising a taken house. Nest imports are not
  // transitive, so UnlockModule already importing it is not enough.
  imports: [CreditModule, ListingModule, SystemConfigModule, UnlockModule, UserModule],
  controllers: [ConfirmationController],
  providers: [
    ConfirmationService,
    ConfirmationNotifierService,
    ConfirmationRepository,
    ListingHandoverService,
    SettlementService,
    StaleConfirmationService,
    SuccessFeeSettlementService,
    SuccessFeeService,
  ],
  exports: [ConfirmationService, StaleConfirmationService, SuccessFeeService],
})
export class ConfirmationModule {}
