/**
 * Purpose: Wires the listing module: lifecycle service, cache, media
 * resolver, and controller.
 * Why important: keeps listing concerns (supply side) self-contained per the
 * modular monolith rules.
 * Used by: AppModule and modules that consume ListingService/cache exports.
 */
import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { ListingCacheService } from './listing-cache.service';
import { ListingController } from './listing.controller';
import { ListingSeedService } from './listing-seed.service';
import { ListingService } from './listing.service';
import { ListingMediaResolver } from './persistence/listing-media.resolver';

@Module({
  imports: [UserModule, SystemConfigModule],
  controllers: [ListingController],
  providers: [ListingService, ListingCacheService, ListingMediaResolver, ListingSeedService],
  exports: [ListingService, ListingCacheService, ListingSeedService],
})
export class ListingModule {}
