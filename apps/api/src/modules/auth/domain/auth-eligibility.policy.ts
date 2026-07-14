/**
 * Purpose: Pure invariant checks for whether a stored user may authenticate.
 * Why important: Centralizes the active/banned/verified rules so register,
 *   login, refresh, and password-reset enforce identical account-state
 *   guards instead of each re-implementing the checks.
 * Used by: AuthService (register, verifyOtp, resendOtp, login, refresh,
 *   resetPassword).
 */
import { ForbiddenException } from '@nestjs/common';
import { StoredUser } from '../../user/user.service';

export function assertUserCanAuthenticate(
  user: Pick<StoredUser, 'isActive' | 'isBanned' | 'banReason' | 'phoneVerified'>,
  requireVerified = false,
): void {
  if (!user.isActive) {
    throw new ForbiddenException({
      code: 'ACCOUNT_INACTIVE',
      message: 'Account is inactive',
    });
  }

  if (user.isBanned) {
    throw new ForbiddenException({
      code: 'ACCOUNT_BANNED',
      message: user.banReason ?? 'Account is banned',
    });
  }

  if (requireVerified && !user.phoneVerified) {
    throw new ForbiddenException({
      code: 'PHONE_NOT_VERIFIED',
      message: 'Phone number has not been verified',
    });
  }
}
