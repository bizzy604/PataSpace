/**
 * Purpose: Wires the Clerk backend adapter as an injectable, exportable provider.
 * Why important: Lets feature modules depend on Clerk admin operations through a
 *   shared adapter instead of constructing their own Clerk client.
 * Used by: UserModule (account deletion); future modules needing Clerk admin ops.
 */
import { Module } from '@nestjs/common';
import { ClerkAccountAdapter } from './clerk-account.adapter';

@Module({
  providers: [ClerkAccountAdapter],
  exports: [ClerkAccountAdapter],
})
export class ClerkModule {}
