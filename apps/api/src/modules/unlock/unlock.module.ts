import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module';
import { ListingModule } from '../listing/listing.module';
import { UserModule } from '../user/user.module';
import { ReceivedUnlockService } from './received-unlock.service';
import { UnlockController } from './unlock.controller';
import { UnlockService } from './unlock.service';

@Module({
  imports: [CreditModule, ListingModule, UserModule],
  controllers: [UnlockController],
  providers: [UnlockService, ReceivedUnlockService],
  exports: [UnlockService, ReceivedUnlockService],
})
export class UnlockModule {}
