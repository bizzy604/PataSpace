/**
 * Purpose: Wires the commission-callback service for the Nest container.
 * Why important: Encapsulates the B2C result handler so PaymentModule can
 *   import it without depending on JobsModule (which would create a cycle).
 * Used by: PaymentModule.
 */
import { Module } from '@nestjs/common';
import { SmsModule } from '../../infrastructure/sms/sms.module';
import { UserModule } from '../user/user.module';
import { CommissionCallbackService } from './commission-callback.service';
import { CommissionTimeoutService } from './commission-timeout.service';

@Module({
  imports: [SmsModule, UserModule],
  providers: [CommissionCallbackService, CommissionTimeoutService],
  exports: [CommissionCallbackService, CommissionTimeoutService],
})
export class CommissionCallbackModule {}
