/**
 * Purpose: Shared test fixtures for the confirmation module specs — a mocked
 *   ConfirmationService factory and a canonical unlock shape.
 * Why important: Keeps confirmation.service.spec.ts and
 *   confirmation.authorization.spec.ts on the same fixture so both suites test
 *   the same buyer/owner identities (buyer_1 unlocked owner_1's listing).
 * Used by: confirmation.service.spec.ts, confirmation.authorization.spec.ts.
 */
import { DEFAULT_PRICING_CONFIG } from '../listing/domain/pricing.policy';
import { ConfirmationService } from './confirmation.service';

export const createConfirmationService = () => {
  const prismaService = {
    confirmation: {
      create: jest.fn(),
    },
    commission: {
      findUnique: jest.fn(),
    },
    unlock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const notifier = {
    sendConfirmationNotifications: jest.fn(),
    sendSmsQuietly: jest.fn(),
  };
  const successFeeService = {
    ensureForConfirmedUnlock: jest.fn().mockResolvedValue({
      feeDueKes: 2500,
      creditsApplied: 300,
      cashCollectedKes: 0,
      remainingKes: 2200,
      status: 'PARTIAL',
    }),
  };
  const proxySessionService = {
    extendForConfirmedUnlock: jest.fn(),
  };
  const systemConfig = {
    resolvePricingConfig: jest.fn().mockResolvedValue(DEFAULT_PRICING_CONFIG),
  };

  return {
    notifier,
    prismaService,
    proxySessionService,
    successFeeService,
    systemConfig,
    service: new ConfirmationService(
      prismaService as never,
      notifier as never,
      successFeeService as never,
      proxySessionService as never,
      systemConfig as never,
    ),
  };
};

export const createUnlock = (overrides = {}) => ({
  id: 'unlock_1',
  buyerId: 'buyer_1',
  creditsSpent: 300,
  isRefunded: false,
  refundReason: null,
  refundedAt: null,
  listing: {
    id: 'listing_1',
    userId: 'owner_1',
    neighborhood: 'Kilimani',
    monthlyRent: 25000,
    successFeeKes: 2500,
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
