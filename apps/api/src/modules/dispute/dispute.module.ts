import { Module } from '@nestjs/common';
import { ConfirmationModule } from '../confirmation/confirmation.module';
import { UnlockModule } from '../unlock/unlock.module';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';

@Module({
  imports: [UnlockModule, ConfirmationModule],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
