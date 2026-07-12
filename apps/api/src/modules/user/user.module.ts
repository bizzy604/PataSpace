/**
 * Purpose: Wires the user feature module — profile reads and account deletion.
 * Why important: Owns the user-facing endpoints and exposes UserService to the
 *   auth layer (Clerk/JWT strategies) for principal resolution.
 * Used by: AppModule; ClerkJwtStrategy/JwtStrategy consume the exported UserService.
 */
import { Module } from '@nestjs/common';
import { ClerkModule } from '../../infrastructure/clerk/clerk.module';
import { AccountDeletionService } from './account-deletion.service';
import { PhoneVerificationService } from './phone-verification.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ClerkModule],
  controllers: [UserController],
  providers: [UserService, AccountDeletionService, PhoneVerificationService],
  exports: [UserService],
})
export class UserModule {}
