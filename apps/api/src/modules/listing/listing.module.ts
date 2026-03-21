import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { ListingCacheService } from './listing-cache.service';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';

@Module({
  imports: [UserModule],
  controllers: [ListingController],
  providers: [ListingService, ListingCacheService],
  exports: [ListingService, ListingCacheService],
})
export class ListingModule {}
