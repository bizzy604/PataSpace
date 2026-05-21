/**
 * Purpose: Wires the saved-listing controller + service for the Nest container.
 * Why important: Keeps saved-listing functionality self-contained inside the
 *   modular monolith.
 * Used by: app.module.ts.
 */
import { Module } from '@nestjs/common';
import { SavedListingController } from './saved-listing.controller';
import { SavedListingService } from './saved-listing.service';

@Module({
  controllers: [SavedListingController],
  providers: [SavedListingService],
  exports: [SavedListingService],
})
export class SavedListingModule {}
