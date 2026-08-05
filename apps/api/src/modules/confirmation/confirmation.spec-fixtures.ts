/**
 * Purpose: Shared test fixtures for the confirmation module specs — factories
 *   for ConfirmationService, SettlementService and StaleConfirmationService with
 *   their collaborators mocked, plus a canonical unlock shape.
 * Why important: Keeps every confirmation suite on the same fixture so they all
 *   test the same identities (buyer_1 unlocked owner_1's listing_1). The
 *   settlement harness is where the listing-handover wire-in is asserted, so the
 *   mocks have to mirror the real collaborator surface exactly.
 * Used by: confirmation.service.spec.ts, confirmation.authorization.spec.ts,
 *   settlement.service.spec.ts, stale-confirmation.service.spec.ts.
 */
import { SettlementService } from './application/settlement.service';
import { StaleConfirmationService } from './application/stale-confirmation.service';
import { ConfirmationService } from './confirmation.service';
import { DEFAULT_PRICING_CONFIG } from '../listing/domain/pricing.policy';

const SUCCESS_FEE = {
  feeDueKes: 2500,
  creditsApplied: 300,
  cashCollectedKes: 0,
  remainingKes: 2200,
  status: 'PARTIAL',
};

/** Mirrors ConfirmationRepository: every method the services call, nothing else. */
export const createRepository = () => ({
  createConfirmation: jest.fn(),
  findCommission: jest.fn(),
  findStaleUnlockCandidates: jest.fn(),
  findUnlock: jest.fn(),
  findUnlockForSettlement: jest.fn(),
});

export const createSettlementHarness = () => {
  const repository = createRepository();
  const successFeeService = {
    ensureForConfirmedUnlock: jest.fn().mockResolvedValue(SUCCESS_FEE),
  };
  const proxySessionService = {
    extendForConfirmedUnlock: jest.fn(),
  };
  const listingHandoverService = {
    handOverListing: jest.fn().mockResolvedValue(true),
  };

  return {
    listingHandoverService,
    proxySessionService,
    repository,
    successFeeService,
    service: new SettlementService(
      repository as never,
      successFeeService as never,
      proxySessionService as never,
      listingHandoverService as never,
    ),
  };
};

export const createStaleConfirmationHarness = () => {
  const repository = createRepository();
  const notifier = {
    sendConfirmationNotifications: jest.fn(),
    sendSmsQuietly: jest.fn(),
  };
  const settlementService = {
    ensureSettlementIfEligible: jest.fn().mockResolvedValue(null),
  };

  return {
    notifier,
    repository,
    settlementService,
    service: new StaleConfirmationService(
      repository as never,
      notifier as never,
      settlementService as never,
    ),
  };
};

export const createConfirmationService = () => {
  const repository = createRepository();
  const notifier = {
    sendConfirmationNotifications: jest.fn(),
    sendSmsQuietly: jest.fn(),
  };
  const settlementService = {
    ensureSettlementIfEligible: jest.fn().mockResolvedValue(null),
  };
  const systemConfig = {
    resolvePricingConfig: jest.fn().mockResolvedValue(DEFAULT_PRICING_CONFIG),
  };

  return {
    notifier,
    repository,
    settlementService,
    systemConfig,
    service: new ConfirmationService(
      repository as never,
      notifier as never,
      settlementService as never,
      systemConfig as never,
    ),
  };
};

/** A settled unlock: both sides confirmed, so SettlementService will act on it. */
export const createSettlementOutcome = (overrides = {}) => ({
  commission: {
    amountKES: 210,
    status: 'PENDING',
    eligibleAt: new Date('2026-03-31T09:00:00.000Z'),
  },
  successFee: SUCCESS_FEE,
  ...overrides,
});

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
