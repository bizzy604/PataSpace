/**
 * Purpose: Wires the support feature controller + service for the Nest container.
 * Why important: Encapsulates the support boundary so it does not leak implementation
 *   into the rest of the modular monolith.
 * Used by: app.module.ts.
 */
import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportThreadService } from './support-thread.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupportThreadService],
  exports: [SupportService],
})
export class SupportModule {}
