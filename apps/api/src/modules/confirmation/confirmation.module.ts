/**
 * Purpose: Wires the confirmation module: confirmation loop, success-fee
 * settlement, and SMS notifier.
 * Why important: this module owns the payout trigger; its exports are
 * consumed by disputes and background jobs.
 * Used by: AppModule, DisputeModule, JobsModule.
 */
import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module';
import { UnlockModule } from '../unlock/unlock.module';
import { UserModule } from '../user/user.module';
import { ConfirmationController } from './confirmation.controller';
import { ConfirmationNotifierService } from './confirmation-notifier.service';
import { ConfirmationService } from './confirmation.service';
import { SuccessFeeService } from './success-fee.service';

@Module({
  imports: [CreditModule, UnlockModule, UserModule],
  controllers: [ConfirmationController],
  providers: [ConfirmationService, ConfirmationNotifierService, SuccessFeeService],
  exports: [ConfirmationService, SuccessFeeService],
})
export class ConfirmationModule {}
