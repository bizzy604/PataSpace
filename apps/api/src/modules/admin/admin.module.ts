import { Module } from '@nestjs/common';
import { ListingModule } from '../listing/listing.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [ListingModule],
  controllers: [AdminController],
})
export class AdminModule {}
