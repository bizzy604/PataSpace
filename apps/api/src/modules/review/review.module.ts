/**
 * Purpose: Wires the review feature controller + service for the Nest container.
 * Why important: Keeps the review boundary self-contained inside the modular monolith.
 * Used by: app.module.ts.
 */
import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
