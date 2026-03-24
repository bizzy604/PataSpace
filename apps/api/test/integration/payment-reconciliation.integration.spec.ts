import { TransactionStatus } from '@prisma/client';
import { MpesaClient } from '../../src/infrastructure/payment/mpesa.client';
import { CreditService } from '../../src/modules/credit/credit.service';
import { PaymentService } from '../../src/modules/payment/payment.service';
import { createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Prisma-backed payment reconciliation flows', () => {
  let context: ApiTestContext;
  let creditService: CreditService;
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
    creditService = context.get(CreditService);
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
      phoneNumber: buyer.phoneNumber,
    });

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
    await expect(creditService.getBalance(buyer.userId)).resolves.toMatchObject({
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
      callbackResultCode: 1,
      callbackResultDesc: 'Insufficient funds',
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
      phoneNumber: buyer.phoneNumber,
    });

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
    await expect(creditService.getBalance(buyer.userId)).resolves.toMatchObject({
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
      callbackResultCode: 1032,
      callbackResultDesc: 'Request cancelled by user',
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
      phoneNumber: buyer.phoneNumber,
    });

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
});
