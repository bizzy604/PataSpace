/**
 * Purpose: Wires the referral feature controller + service for the Nest container.
 * Why important: Encapsulates the referral boundary so it does not leak into
 *   the rest of the modular monolith.
 * Used by: app.module.ts.
 */
import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
