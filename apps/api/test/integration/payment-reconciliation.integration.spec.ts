import { PaymentMethod, TransactionStatus, TransactionType } from '@prisma/client';
import { MpesaClient } from '../../src/infrastructure/payment/mpesa.client';
import { CreditQueryService } from '../../src/modules/credit/credit-query.service';
import { PaymentService } from '../../src/modules/payment/payment.service';
import { createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Prisma-backed payment reconciliation flows', () => {
  let context: ApiTestContext;
  let creditQueryService: CreditQueryService;
  let paymentService: PaymentService;
  let checkoutCounter = 0;

  const mpesaClientMock = {
    b2c: jest.fn(),
    healthCheck: jest.fn(),
    queryStkPush: jest.fn(),
    stkPush: jest.fn(),
  };

  beforeAll(async () => {
    context = await createApiTestContext({
      ipRangePrefix: 67,
      overrides: [
        {
          token: MpesaClient,
          value: mpesaClientMock,
        },
      ],
    });
    creditQueryService = context.get(CreditQueryService);
    paymentService = context.get(PaymentService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mpesaClientMock.healthCheck.mockResolvedValue({
      provider: 'sandbox',
      status: 'up',
    });
    mpesaClientMock.b2c.mockResolvedValue({
      conversationId: 'b2c-conversation',
      originatorConversationId: 'b2c-originator',
      responseCode: '0',
      responseDescription: 'Sandbox B2C request accepted.',
    });
    mpesaClientMock.stkPush.mockImplementation(async () => {
      checkoutCounter += 1;

      return {
        checkoutRequestId: `ws_CO_integration_${checkoutCounter}`,
        merchantRequestId: `ws_MR_integration_${checkoutCounter}`,
        responseCode: '0',
        responseDescription: 'Sandbox STK push accepted.',
      };
    });
  });

  afterAll(async () => {
    await context.close();
  });

  it('persists failed reconciliation outcomes without crediting the user', async () => {
    const buyer = await createVerifiedUser(context);
    mpesaClientMock.queryStkPush.mockImplementation(async ({ checkoutRequestId }) => ({
      checkoutRequestId,
      responseCode: '0',
      resultCode: 1,
      resultDesc: 'Insufficient funds',
      phoneNumber: buyer.phoneNumber,
    }));

    const purchase = await paymentService.createPurchase(buyer.userId, {
      package: '5_credits',
      paymentMethod: 'mpesa',
      phoneNumber: buyer.phoneNumber,
    }, `it-key-1-${Date.now()}`);

    await context.prismaService.creditTransaction.update({
      where: {
        id: purchase.transactionId,
      },
      data: {
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    await expect(
      paymentService.reconcilePendingPurchases(new Date(), buyer.userId),
    ).resolves.toBe(1);
    await expect(creditQueryService.getBalance(buyer.userId)).resolves.toMatchObject({
      balance: 0,
      lifetimeEarned: 0,
    });

    const storedTransaction = await context.prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: purchase.transactionId,
      },
      select: {
        status: true,
        balanceAfter: true,
        metadata: true,
      },
    });

    expect(storedTransaction.status).toBe(TransactionStatus.FAILED);
    expect(storedTransaction.balanceAfter).toBe(0);
    expect(storedTransaction.metadata).toMatchObject({
      resultCode: 1,
      resultDesc: 'Insufficient funds',
      callbackPhoneNumber: buyer.phoneNumber,
    });
  });

  it('persists cancelled reconciliation outcomes without crediting the user', async () => {
    const buyer = await createVerifiedUser(context);
    mpesaClientMock.queryStkPush.mockImplementation(async ({ checkoutRequestId }) => ({
      checkoutRequestId,
      responseCode: '0',
      resultCode: 1032,
      resultDesc: 'Request cancelled by user',
      phoneNumber: buyer.phoneNumber,
    }));

    const purchase = await paymentService.createPurchase(buyer.userId, {
      package: '5_credits',
      paymentMethod: 'mpesa',
      phoneNumber: buyer.phoneNumber,
    }, `it-key-2-${Date.now()}`);

    await context.prismaService.creditTransaction.update({
      where: {
        id: purchase.transactionId,
      },
      data: {
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    await expect(
      paymentService.reconcilePendingPurchases(new Date(), buyer.userId),
    ).resolves.toBe(1);
    await expect(creditQueryService.getBalance(buyer.userId)).resolves.toMatchObject({
      balance: 0,
      lifetimeEarned: 0,
    });

    const storedTransaction = await context.prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: purchase.transactionId,
      },
      select: {
        status: true,
        balanceAfter: true,
        metadata: true,
      },
    });

    expect(storedTransaction.status).toBe(TransactionStatus.CANCELLED);
    expect(storedTransaction.balanceAfter).toBe(0);
    expect(storedTransaction.metadata).toMatchObject({
      resultCode: 1032,
      resultDesc: 'Request cancelled by user',
      callbackPhoneNumber: buyer.phoneNumber,
    });
  });

  it('leaves stale pending purchases untouched when the reconciliation query fails', async () => {
    const buyer = await createVerifiedUser(context);
    mpesaClientMock.queryStkPush.mockRejectedValue(
      new Error('Sandbox STK status query failed.'),
    );

    const purchase = await paymentService.createPurchase(buyer.userId, {
      package: '5_credits',
      paymentMethod: 'mpesa',
      phoneNumber: buyer.phoneNumber,
    }, `it-key-3-${Date.now()}`);

    await context.prismaService.creditTransaction.update({
      where: {
        id: purchase.transactionId,
      },
      data: {
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    await expect(
      paymentService.reconcilePendingPurchases(new Date(), buyer.userId),
    ).resolves.toBe(0);

    const storedTransaction = await context.prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: purchase.transactionId,
      },
      select: {
        status: true,
        balanceAfter: true,
      },
    });

    expect(storedTransaction.status).toBe(TransactionStatus.PENDING);
    expect(storedTransaction.balanceAfter).toBe(0);
  });

  it('collapses concurrent same-key purchases to a single transaction and one STK push', async () => {
    const buyer = await createVerifiedUser(context);
    const idempotencyKey = `parallel-${Date.now()}`;
    const input = {
      package: '5_credits' as const,
      paymentMethod: 'mpesa' as const,
      phoneNumber: buyer.phoneNumber,
    };

    const results = await Promise.allSettled([
      paymentService.createPurchase(buyer.userId, input, idempotencyKey),
      paymentService.createPurchase(buyer.userId, input, idempotencyKey),
    ]);

    // The DB constraint is the arbiter: exactly one row exists for the key.
    const rows = await context.prismaService.creditTransaction.findMany({
      where: { userId: buyer.userId, idempotencyKey },
    });
    expect(rows).toHaveLength(1);
    expect(mpesaClientMock.stkPush).toHaveBeenCalledTimes(1);

    // Every fulfilled request reports the same transaction; a loser may
    // instead reject with the in-progress conflict, never a second charge.
    const fulfilled = results.filter(
      (result) => result.status === 'fulfilled',
    ) as Array<PromiseFulfilledResult<{ transactionId: string }>>;
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    for (const result of fulfilled) {
      expect(result.value.transactionId).toBe(rows[0].id);
    }
  });

  it('expires a pending purchase that never got a checkout id, unblocking the user', async () => {
    const buyer = await createVerifiedUser(context);
    // Simulate the crash window: a PENDING purchase with no CheckoutRequestID,
    // already older than the reconciliation timeout.
    const stuck = await context.prismaService.creditTransaction.create({
      data: {
        userId: buyer.userId,
        type: TransactionType.PURCHASE,
        amount: 5000,
        balanceBefore: 0,
        balanceAfter: 0,
        status: TransactionStatus.PENDING,
        paymentMethod: PaymentMethod.MPESA,
        idempotencyKey: `stuck-${Date.now()}`,
        metadata: { paymentAmountKES: 5000 },
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    const response = await paymentService.createPurchase(
      buyer.userId,
      { package: '5_credits', paymentMethod: 'mpesa', phoneNumber: buyer.phoneNumber },
      `fresh-${Date.now()}`,
    );

    expect(response.status).toBe(TransactionStatus.PENDING);
    const expired = await context.prismaService.creditTransaction.findUniqueOrThrow({
      where: { id: stuck.id },
    });
    expect(expired.status).toBe(TransactionStatus.FAILED);
  });
});
