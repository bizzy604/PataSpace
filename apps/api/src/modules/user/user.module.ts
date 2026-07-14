/**
 * Purpose: Wires the user feature module — profile reads and account deletion.
 * Why important: Owns the user-facing endpoints and exposes UserService to the
 *   auth layer (JwtStrategy) for principal resolution.
 * Used by: AppModule; JwtStrategy consumes the exported UserService.
 */
import { Module } from '@nestjs/common';
import { AccountDeletionService } from './account-deletion.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, AccountDeletionService],
  exports: [UserService],
})
export class UserModule {}
