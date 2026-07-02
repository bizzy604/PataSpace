/**
 * Purpose: Shared test fixtures for the confirmation module specs — a mocked
 *   ConfirmationService factory and a canonical unlock shape.
 * Why important: Keeps confirmation.service.spec.ts and
 *   confirmation.authorization.spec.ts on the same fixture so both suites test
 *   the same buyer/owner identities (buyer_1 unlocked owner_1's listing).
 * Used by: confirmation.service.spec.ts, confirmation.authorization.spec.ts.
 */
import { ConfirmationService } from './confirmation.service';

export const createConfirmationService = () => {
  const prismaService = {
    confirmation: {
      create: jest.fn(),
    },
    commission: {
      upsert: jest.fn(),
    },
    unlock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const smsService = {
    sendMessage: jest.fn(),
  };
  const userService = {
    decryptPhoneNumber: jest.fn((value: string) =>
      value === 'buyer-phone' ? '+254700000001' : '+254700000002',
    ),
  };

  return {
    prismaService,
    smsService,
    userService,
    service: new ConfirmationService(
      prismaService as never,
      smsService as never,
      userService as never,
    ),
  };
};

export const createUnlock = (overrides = {}) => ({
  id: 'unlock_1',
  buyerId: 'buyer_1',
  isRefunded: false,
  refundReason: null,
  refundedAt: null,
  listing: {
    userId: 'owner_1',
    neighborhood: 'Kilimani',
    commission: 750,
    user: {
      phoneNumberEncrypted: 'owner-phone',
    },
  },
  buyer: {
    phoneNumberEncrypted: 'buyer-phone',
  },
  confirmations: [],
  dispute: null,
  ...overrides,
});
