/**
 * Purpose: Wires the runtime system-config resolver/editor for the container.
 * Why important: Exports SystemConfigService so the pricing consumers and the
 *   admin config CRUD share one cache and one source of truth.
 * Used by: ListingModule, ConfirmationModule, AdminModule.
 */
import { Module } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';

@Module({
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
