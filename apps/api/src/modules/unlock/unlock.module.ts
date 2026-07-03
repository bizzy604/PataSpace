/**
 * Purpose: Wires the unlock module: paywall service, refund engine,
 * report-dead flow, masked-contact proxy sessions, and the voice webhook.
 * Why important: keeps the demand-side money paths self-contained; other
 * modules consume the exported services, never the internals.
 * Used by: AppModule, DisputeModule, ConfirmationModule.
 */
import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module';
import { ListingModule } from '../listing/listing.module';
import { UserModule } from '../user/user.module';
import { ProxySessionService } from './contact/proxy-session.service';
import { VoiceBridgeService } from './contact/voice-bridge.service';
import { VoiceWebhookController } from './contact/voice-webhook.controller';
import { ReceivedUnlockService } from './received-unlock.service';
import { ReportDeadService } from './report-dead.service';
import { UnlockController } from './unlock.controller';
import { UnlockRefundService } from './unlock-refund.service';
import { UnlockService } from './unlock.service';

@Module({
  imports: [CreditModule, ListingModule, UserModule],
  controllers: [UnlockController, VoiceWebhookController],
  providers: [
    UnlockService,
    UnlockRefundService,
    ReportDeadService,
    ReceivedUnlockService,
    ProxySessionService,
    VoiceBridgeService,
  ],
  exports: [UnlockService, UnlockRefundService, ReceivedUnlockService, ProxySessionService],
})
export class UnlockModule {}
