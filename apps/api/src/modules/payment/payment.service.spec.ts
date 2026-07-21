/**
 * Purpose: Gate tests for the purchase orchestrator: account guards, routing,
 * idempotent replay on a same-key retry, the superseded-insert race, and the
 * key/method being persisted on the transaction row.
 * Why important: this is where money is created — a same-key retry must
 * never trigger a second STK push, and two live pushes for one user must be
 * impossible.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ConflictException, ForbiddenException, HttpException } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { PaymentService } from './payment.service';

const IDEMPOTENCY_KEY = 'purchase-attempt-0001';

describe('PaymentService (orchestrator)', () => {
  const createStoredUser = (overrides = {}) => ({
    id: 'user_1',
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
      creditTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const creditService = {
      getCurrentBalanceValue: jest.fn().mockResolvedValue(0),
      createTransaction: jest.fn().mockResolvedValue({ id: 'txn_1', metadata: {} }),
      invalidateBalanceCache: jest.fn(),
    };

    const userService = {
      findStoredById: jest.fn().mockResolvedValue(createStoredUser()),
    };

    const mpesaPurchaseService = {
      executeStkPush: jest.fn().mockResolvedValue({ checkoutRequestId: 'ws_CO_123' }),
      handleCallback: jest.fn().mockResolvedValue({ ResultCode: 0, ResultDesc: 'Accepted' }),
    };

    const mpesaReconcileService = {
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
      mpesaReconcileService as never,
      stellarPurchaseService as never,
    );

    return {
      prismaService,
      creditService,
      userService,
      mpesaPurchaseService,
      mpesaReconcileService,
      stellarPurchaseService,
      service,
    };
  };

  const mpesaInput = {
    package: '5000_credits' as const,
    paymentMethod: 'mpesa' as const,
    phoneNumber: '+254712345678',
  };

  describe('createPurchase — guards', () => {
    it('rejects when user is not found', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(null);

      await expect(
        service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('rejects when phone is not verified for mpesa purchases', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser({ phoneVerified: false }));

      await expect(
        service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when the account is inactive or banned', async () => {
      const { service, userService } = createService();

      userService.findStoredById.mockResolvedValue(createStoredUser({ isActive: false }));
      await expect(
        service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY),
      ).rejects.toBeInstanceOf(ForbiddenException);

      userService.findStoredById.mockResolvedValue(
        createStoredUser({ isBanned: true, banReason: 'Policy violation' }),
      );
      await expect(
        service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when a purchase is already pending', async () => {
      const { service, prismaService, creditService } = createService();
      prismaService.creditTransaction.findFirst.mockResolvedValue({ id: 'txn_pending' });

      await expect(
        service.createPurchase('user_1', { ...mpesaInput, package: '10000_credits' }, IDEMPOTENCY_KEY),
      ).rejects.toBeInstanceOf(HttpException);

      expect(creditService.createTransaction).not.toHaveBeenCalled();
    });
  });

  describe('createPurchase — idempotency', () => {
    it('persists the key and payment method on the transaction row', async () => {
      const { service, creditService } = createService();

      await service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY);

      expect(creditService.createTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          idempotencyKey: IDEMPOTENCY_KEY,
          paymentMethod: 'MPESA',
          status: TransactionStatus.PENDING,
        }),
      );
    });

    it('replays a same-key retry even while the original purchase is still pending', async () => {
      const { service, creditService, prismaService, mpesaPurchaseService } = createService();
      prismaService.creditTransaction.findUnique.mockResolvedValue({
        id: 'txn_original',
        status: TransactionStatus.PENDING,
        amount: 5000,
        paymentMethod: 'MPESA',
        metadata: { paymentAmountKES: 5000 },
      });
      // The one-pending-at-a-time guard would 402 here — the replay must win.
      prismaService.creditTransaction.findFirst.mockResolvedValue({ id: 'txn_original' });

      const result = await service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY);

      expect(result.transactionId).toBe('txn_original');
      expect(result.amount).toBe(5000);
      expect(result.credits).toBe(5000);
      expect(result.message).toContain('already processed');
      expect(creditService.createTransaction).not.toHaveBeenCalled();
      expect(mpesaPurchaseService.executeStkPush).not.toHaveBeenCalled();
      expect(prismaService.creditTransaction.findUnique).toHaveBeenCalledWith({
        where: { userId_idempotencyKey: { userId: 'user_1', idempotencyKey: IDEMPOTENCY_KEY } },
        select: expect.anything(),
      });
    });

    it('replays via the constraint when two same-key requests race the insert', async () => {
      const { service, creditService, prismaService, mpesaPurchaseService } = createService();
      creditService.createTransaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      prismaService.creditTransaction.findUnique
        .mockResolvedValueOnce(null) // pre-insert lookup: nothing committed yet
        .mockResolvedValueOnce({
          id: 'txn_original',
          status: TransactionStatus.PENDING,
          amount: 5000,
          paymentMethod: 'MPESA',
          metadata: { paymentAmountKES: 5000 },
        });

      const result = await service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY);

      expect(result.transactionId).toBe('txn_original');
      expect(mpesaPurchaseService.executeStkPush).not.toHaveBeenCalled();
    });

    it('conflicts when the key collided but the first request has not committed yet', async () => {
      const { service, creditService, prismaService, mpesaPurchaseService } = createService();
      creditService.createTransaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      prismaService.creditTransaction.findUnique.mockResolvedValue(null);

      await expect(
        service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mpesaPurchaseService.executeStkPush).not.toHaveBeenCalled();
    });

    it('voids its own insert when another purchase won the pending race', async () => {
      const { service, prismaService, mpesaPurchaseService } = createService();
      prismaService.creditTransaction.findFirst
        .mockResolvedValueOnce(null) // pre-insert check
        .mockResolvedValueOnce({ id: 'txn_other' }); // post-insert verify

      await expect(
        service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY),
      ).rejects.toMatchObject({ status: 402 });

      expect(prismaService.creditTransaction.update).toHaveBeenCalledWith({
        where: { id: 'txn_1' },
        data: expect.objectContaining({
          status: TransactionStatus.CANCELLED,
        }),
      });
      expect(mpesaPurchaseService.executeStkPush).not.toHaveBeenCalled();
    });
  });

  describe('createPurchase — routing', () => {
    it('delegates STK push to MpesaPurchaseService and returns pending response', async () => {
      const { service, mpesaPurchaseService } = createService();

      const result = await service.createPurchase('user_1', mpesaInput, IDEMPOTENCY_KEY);

      expect(mpesaPurchaseService.executeStkPush).toHaveBeenCalled();
      expect(result.paymentMethod).toBe('mpesa');
      expect(result.status).toBe(TransactionStatus.PENDING);
      expect(result.credits).toBe(5000);
      expect(result.amount).toBe(5000);
    });

    it('does not require phoneVerified for stellar purchases', async () => {
      const { service, userService } = createService();
      userService.findStoredById.mockResolvedValue(createStoredUser({ phoneVerified: false }));

      const result = await service.createPurchase(
        'user_1',
        { package: '5000_credits', paymentMethod: 'stellar' },
        IDEMPOTENCY_KEY,
      );

      expect(result.paymentMethod).toBe('stellar');
    });

    it('delegates to StellarPurchaseService and returns address + memo', async () => {
      const { service, stellarPurchaseService, mpesaPurchaseService } = createService();

      const result = await service.createPurchase(
        'user_1',
        { package: '5000_credits', paymentMethod: 'stellar' },
        IDEMPOTENCY_KEY,
      );

      expect(stellarPurchaseService.createPaymentRequest).toHaveBeenCalled();
      expect(mpesaPurchaseService.executeStkPush).not.toHaveBeenCalled();
      expect(result.stellarDestinationAddress).toBe('GABC...TREASURY');
      expect(result.stellarMemo).toBe('txn_1');
      expect(result.stellarAmountXLM).toBe('29.4117647');
      expect(result.status).toBe(TransactionStatus.PENDING);
    });
  });

  describe('reconcilePendingPurchases', () => {
    it('delegates to both reconcilers and returns the combined count', async () => {
      const { service, mpesaReconcileService, stellarPurchaseService } = createService();
      mpesaReconcileService.reconcilePending.mockResolvedValue(2);
      stellarPurchaseService.reconcilePending.mockResolvedValue(1);

      const now = new Date();
      const result = await service.reconcilePendingPurchases(now);

      expect(mpesaReconcileService.reconcilePending).toHaveBeenCalledWith(now, undefined);
      expect(stellarPurchaseService.reconcilePending).toHaveBeenCalledWith(now, undefined);
      expect(result).toBe(3);
    });
  });
});
