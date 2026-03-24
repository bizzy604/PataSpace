import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module';
import { UserModule } from '../user/user.module';
import {
  CreditPurchaseController,
  PaymentWebhookController,
} from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [CreditModule, UserModule],
  controllers: [CreditPurchaseController, PaymentWebhookController],
  providers: [PaymentService],
})
export class PaymentModule {}
