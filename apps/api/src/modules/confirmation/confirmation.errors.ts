/**
 * Purpose: The confirmation module's shared error factories, so the same code
 * and message reach the client whether the duplicate is caught by the in-memory
 * check or by the database's unique constraint.
 * Why important: ALREADY_CONFIRMED is raised from two places that would
 * otherwise drift apart, and the mobile client branches on the code.
 * Used by: ConfirmationService, ConfirmationRepository.
 */
import { BadRequestException } from '@nestjs/common';

export function alreadyConfirmedError(): BadRequestException {
  return new BadRequestException({
    code: 'ALREADY_CONFIRMED',
    message: 'This side has already confirmed the unlock',
  });
}
