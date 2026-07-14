/**
 * Purpose: Unit tests for the PaymentService orchestrator — covers user validation,
 *          transaction creation, and correct routing to M-Pesa or Stellar sub-services.
 * Why important: Ensures the orchestrator guards, routes, and delegates correctly without
 *               re-testing the internals of MpesaPurchaseService or StellarPurchaseService.
 * Used by: Jest test runner
 */

import { ForbiddenException, HttpException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PaymentService } from './payment.service';

describe('PaymentService (orchestrator)', () => {
  const createStoredUser = (overrides = {}) => ({
    id: 'user_1',
    clerkId: null,
    phoneVerified: true,
    isActive: true,
    isBanned: false,
    banReason: null,
    phoneNumberEncrypted: 'encrypted-phone',
    email: 'user@example.com',
    passwordHash: 'hash',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'USER' as never,
    createdAt: new Date('2026-03-24T08:00:00.000Z'),
    updatedAt: new Date('2026-03-24T08:00:00.000Z'),
    lastLoginAt: null,
    ...overrides,
  });

  const createService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      creditTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const creditService = {
      getCurrentBalanceValue: jest.fn().mockResolvedValue(0),
      createTransaction: jest.fn().mockResolvedValue({ id: 'txn_1', metadata: {} }),
      applyBalanceIncrement: jest.fn(),
      invalidateBalanceCache: jest.fn(),
    };

    const userService = {
      findStoredById: jest.fn(),
      decryptPhoneNumber: jest.fn().mockReturnValue('+254712345678'),
    };

    const mpesaPurchaseService = {
      executeStkPush: jest.fn().mockResolvedValue({ checkoutRequestId: 'ws_CO_123' }),
      handleCallback: jest.fn().mockResolvedValue({ ResultCode: 0, ResultDesc: 'Accepted' }),
      reconcilePending: jest.fn().mockResolvedValue(0),
    };

    const stellarPurchaseService = {
      createPaymentRequest: jest.fn().mockResolvedValue({
        stellarDestinationAddress: 'GABC...TREASURY',
        stellarMemo: 'txn_1',
        stellarAmountXLM: '29.4117647',
        network: 'testnet',
      }),
      reconcilePending: jest.fn().mockResolvedValue(0),
    };

    const service = new PaymentService(
      prismaService as never,
      creditService as never,
      userService as never,
      mpesaPurchaseService as never,
      stellarPurchaseService as never,
    );

    return { prismaService, creditService, userService, mpesaPurchaseService, stellarPurchaseService, service };
  };

  describe('createPurchase — M-Pesa path', () => {
    it('rejects when user is not found', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(null);

      await expect(
        service.createPurchase('user_1', { package: '5_credits', paymentMethod: 'mpesa', phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('rejects when phone is not verified for mpesa purchases', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser({ phoneVerified: false }));

      await expect(
        service.createPurchase('user_1', { package: '5_credits', paymentMethod: 'mpesa', phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Regression: a stale clerkId (orphaned column, Docs/14 Phase 1) used to
    // exempt a never-verified account from this gate — an unverified user
    // could start an M-Pesa STK push on a phone number they never proved
    // they owned. The gate must now be a hard phoneVerified check.
    it('rejects an unverified account even if it carries an orphaned clerkId', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(
        createStoredUser({ phoneVerified: false, clerkId: 'ck_orphaned' }),
      );

      await expect(
        service.createPurchase('user_1', { package: '5_credits', paymentMethod: 'mpesa', phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when the account is inactive', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser({ isActive: false }));

      await expect(
        service.createPurchase('user_1', { package: '5_credits', paymentMethod: 'mpesa', phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when the account is banned', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser({ isBanned: true, banReason: 'Policy violation' }));

      await expect(
        service.createPurchase('user_1', { package: '5_credits', paymentMethod: 'mpesa', phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when a purchase is already pending', async () => {
      const { service, userService, prismaService, creditService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser());
      prismaService.creditTransaction.findFirst.mockResolvedValue({ id: 'txn_pending' });

      await expect(
        service.createPurchase('user_1', { package: '10_credits', paymentMethod: 'mpesa', phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(HttpException);

      expect(creditService.createTransaction).not.toHaveBeenCalled();
    });

    it('delegates STK push to MpesaPurchaseService and returns pending response', async () => {
      const { service, userService, mpesaPurchaseService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser());

      const result = await service.createPurchase('user_1', {
        package: '5_credits',
        paymentMethod: 'mpesa',
        phoneNumber: '+254712345678',
      });

      expect(mpesaPurchaseService.executeStkPush).toHaveBeenCalled();
      expect(result.paymentMethod).toBe('mpesa');
      expect(result.status).toBe(TransactionStatus.PENDING);
      expect(result.credits).toBe(5000);
      expect(result.amount).toBe(5000);
    });
  });

  describe('createPurchase — Stellar path', () => {
    it('does not require phoneVerified for stellar purchases', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser({ phoneVerified: false, clerkId: null }));

      const result = await service.createPurchase('user_1', {
        package: '5_credits',
        paymentMethod: 'stellar',
      });

      expect(result.paymentMethod).toBe('stellar');
    });

    it('delegates to StellarPurchaseService and returns address + memo', async () => {
      const { service, userService, stellarPurchaseService, mpesaPurchaseService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser());

      const result = await service.createPurchase('user_1', {
        package: '5_credits',
        paymentMethod: 'stellar',
      });

      expect(stellarPurchaseService.createPaymentRequest).toHaveBeenCalled();
      expect(mpesaPurchaseService.executeStkPush).not.toHaveBeenCalled();
      expect(result.stellarDestinationAddress).toBe('GABC...TREASURY');
      expect(result.stellarMemo).toBe('txn_1');
      expect(result.stellarAmountXLM).toBe('29.4117647');
      expect(result.status).toBe(TransactionStatus.PENDING);
    });
  });

  describe('handleMpesaCallback', () => {
    it('delegates to MpesaPurchaseService and returns ack', async () => {
      const { service, mpesaPurchaseService } = createService();
      const payload = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'ws_MR_123',
            CheckoutRequestID: 'ws_CO_123',
            ResultCode: 0,
            ResultDesc: 'Success',
          },
        },
      };

      const result = await service.handleMpesaCallback(payload);

      expect(mpesaPurchaseService.handleCallback).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
    });
  });

  describe('reconcilePendingPurchases', () => {
    it('delegates to both sub-services and returns combined count', async () => {
      const { service, mpesaPurchaseService, stellarPurchaseService } = createService();
      mpesaPurchaseService.reconcilePending.mockResolvedValue(2);
      stellarPurchaseService.reconcilePending.mockResolvedValue(1);

      const now = new Date();
      const result = await service.reconcilePendingPurchases(now);

      expect(mpesaPurchaseService.reconcilePending).toHaveBeenCalledWith(now, undefined);
      expect(stellarPurchaseService.reconcilePending).toHaveBeenCalledWith(now, undefined);
      expect(result).toBe(3);
    });
  });
});
