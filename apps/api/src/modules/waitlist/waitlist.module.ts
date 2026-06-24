/**
 * Purpose: Wires the waitlist feature controller + service for the Nest container.
 * Why important: Captures pre-launch interest so early users can be notified at launch.
 * Used by: app.module.ts.
 */
import { Module } from '@nestjs/common';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';

@Module({
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
