/**
 * Purpose: Wires the credit wallet module: movement engine, read models, and
 * the wallet HTTP endpoints.
 * Why important: exports the movement engine (CreditService) that payment,
 * unlock, confirmation, referral, and job modules move money through.
 * Used by: AppModule and every money-moving module.
 */
import { Module } from '@nestjs/common';
import { CreditController } from './credit.controller';
import { CreditQueryService } from './credit-query.service';
import { CreditService } from './credit.service';

@Module({
  controllers: [CreditController],
  providers: [CreditService, CreditQueryService],
  exports: [CreditService, CreditQueryService],
})
export class CreditModule {}
