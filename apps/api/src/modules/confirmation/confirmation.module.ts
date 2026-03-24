import { Module } from '@nestjs/common';
import { UnlockModule } from '../unlock/unlock.module';
import { UserModule } from '../user/user.module';
import { ConfirmationController } from './confirmation.controller';
import { ConfirmationService } from './confirmation.service';

@Module({
  imports: [UnlockModule, UserModule],
  controllers: [ConfirmationController],
  providers: [ConfirmationService],
  exports: [ConfirmationService],
})
export class ConfirmationModule {}
