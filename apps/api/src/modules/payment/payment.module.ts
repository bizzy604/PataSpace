/**
 * Purpose: Wires all payment-related services (M-Pesa, Stellar, fulfillment, orchestrator) into one module.
 * Why important: Encapsulates payment feature boundaries so no external module reaches inside.
 * Used by: AppModule
 */

import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module';
import { UserModule } from '../user/user.module';
import { CreditPurchaseController, PaymentWebhookController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MpesaPurchaseService } from './mpesa-purchase.service';
import { StellarPurchaseService } from './stellar-purchase.service';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

@Module({
  imports: [CreditModule, UserModule],
  controllers: [CreditPurchaseController, PaymentWebhookController],
  providers: [
    PaymentService,
    MpesaPurchaseService,
    StellarPurchaseService,
    PaymentFulfillmentService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
