import {
  ForbiddenException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
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

  const createPaymentService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      creditTransaction: {
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
    };
    const creditService = {
      getCurrentBalanceValue: jest.fn(),
      createTransaction: jest.fn(),
      applyBalanceIncrement: jest.fn(),
      invalidateBalanceCache: jest.fn(),
    };
    const userService = {
      findStoredById: jest.fn(),
      decryptPhoneNumber: jest.fn().mockReturnValue('+254712345678'),
    };
    const mpesaClient = {
      stkPush: jest.fn(),
      queryStkPush: jest.fn(),
    };
    const smsService = {
      sendMessage: jest.fn(),
    };

    return {
      prismaService,
      creditService,
      userService,
      mpesaClient,
      smsService,
      service: new PaymentService(
        prismaService as never,
        creditService as never,
        userService as never,
        mpesaClient as never,
        smsService as never,
      ),
    };
  };

  it('marks a purchase as failed when sandbox STK push fails', async () => {
    const { creditService, mpesaClient, prismaService, service, userService } =
      createPaymentService();

    userService.findStoredById.mockResolvedValue(createStoredUser());
    prismaService.creditTransaction.updateMany.mockResolvedValue({ count: 0 });
    prismaService.creditTransaction.findFirst.mockResolvedValue(null);
    creditService.getCurrentBalanceValue.mockResolvedValue(1000);
    creditService.createTransaction.mockResolvedValue({
      id: 'txn_1',
      metadata: {
        paymentAmountKES: 10000,
      },
    });
    mpesaClient.stkPush.mockRejectedValue(new Error('gateway unavailable'));

    await expect(
      service.createPurchase('user_1', {
        package: '10_credits',
        phoneNumber: '+254712345678',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prismaService.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.FAILED,
        }),
        where: {
          id: 'txn_1',
        },
      }),
    );
  });

  it('rejects duplicate pending purchases after reconciliation', async () => {
    const { creditService, prismaService, service, userService } = createPaymentService();

    userService.findStoredById.mockResolvedValue(createStoredUser());
    prismaService.creditTransaction.findFirst.mockResolvedValue({
      id: 'txn_pending',
    });

    await expect(
      service.createPurchase('user_1', {
        package: '10_credits',
        phoneNumber: '+254712345678',
      }),
    ).rejects.toBeInstanceOf(HttpException);
    expect(creditService.createTransaction).not.toHaveBeenCalled();
  });

  it('rejects purchases when the phone number is not verified', async () => {
    const { service, userService } = createPaymentService();

    userService.findStoredById.mockResolvedValue(
      createStoredUser({
        phoneVerified: false,
      }),
    );

    await expect(
      service.createPurchase('user_1', {
        package: '5_credits',
        phoneNumber: '+254712345678',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects purchases when the account is inactive', async () => {
    const { service, userService } = createPaymentService();

    userService.findStoredById.mockResolvedValue(
      createStoredUser({
        isActive: false,
      }),
    );

    await expect(
      service.createPurchase('user_1', {
        package: '5_credits',
        phoneNumber: '+254712345678',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects purchases when the account is banned', async () => {
    const { service, userService } = createPaymentService();

    userService.findStoredById.mockResolvedValue(
      createStoredUser({
        banReason: 'Manual review',
        isBanned: true,
      }),
    );

    await expect(
      service.createPurchase('user_1', {
        package: '5_credits',
        phoneNumber: '+254712345678',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('credits the user balance when a sandbox callback succeeds', async () => {
    const { creditService, prismaService, service, smsService } = createPaymentService();
    const currentTransaction = {
      id: 'txn_1',
      amount: 5000,
      userId: 'user_1',
      metadata: {
        paymentAmountKES: 5000,
        requestedPhoneNumber: '+254712345678',
      },
      phoneNumberHash: null,
      mpesaTransactionId: 'ws_CO_123',
      status: TransactionStatus.PENDING,
    };
    const transactionClient = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(currentTransaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaService.creditTransaction.findFirst.mockResolvedValue({
      id: 'txn_1',
      status: TransactionStatus.PENDING,
    });
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    creditService.applyBalanceIncrement.mockResolvedValue({
      balanceBefore: 0,
      balanceAfter: 5000,
    });
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await expect(
      service.handleMpesaCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'ws_MR_123',
            CheckoutRequestID: 'ws_CO_123',
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 5000 },
                { Name: 'MpesaReceiptNumber', Value: 'PSPACE5000' },
                { Name: 'PhoneNumber', Value: 254712345678 },
              ],
            },
          },
        },
      }),
    ).resolves.toEqual({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
    expect(creditService.applyBalanceIncrement).toHaveBeenCalled();
    expect(creditService.invalidateBalanceCache).toHaveBeenCalledWith('user_1');
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254712345678',
      'Your PataSpace balance has been credited with 5000 credits.',
    );
  });

  it('marks cancelled callbacks without crediting the user', async () => {
    const { creditService, prismaService, service, smsService } = createPaymentService();
    const currentTransaction = {
      id: 'txn_1',
      amount: 5000,
      userId: 'user_1',
      metadata: {
        requestedPhoneNumber: '+254712345678',
      },
      phoneNumberHash: null,
      mpesaTransactionId: 'ws_CO_123',
      status: TransactionStatus.PENDING,
    };
    const transactionClient = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(currentTransaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaService.creditTransaction.findFirst.mockResolvedValue({
      id: 'txn_1',
      status: TransactionStatus.PENDING,
    });
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await service.handleMpesaCallback({
      Body: {
        stkCallback: {
          MerchantRequestID: 'ws_MR_123',
          CheckoutRequestID: 'ws_CO_123',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user',
        },
      },
    });

    expect(creditService.applyBalanceIncrement).not.toHaveBeenCalled();
    expect(transactionClient.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.CANCELLED,
        }),
      }),
    );
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254712345678',
      'Your PataSpace credit purchase failed: Request cancelled by user',
    );
  });

  it('marks amount-mismatched callbacks as failed without crediting the user', async () => {
    const { creditService, prismaService, service, smsService } = createPaymentService();
    const currentTransaction = {
      id: 'txn_1',
      amount: 5000,
      userId: 'user_1',
      metadata: {
        paymentAmountKES: 5000,
        requestedPhoneNumber: '+254712345678',
      },
      phoneNumberHash: null,
      mpesaTransactionId: 'ws_CO_123',
      status: TransactionStatus.PENDING,
    };
    const transactionClient = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(currentTransaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaService.creditTransaction.findFirst.mockResolvedValue({
      id: 'txn_1',
      status: TransactionStatus.PENDING,
    });
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await service.handleMpesaCallback({
      Body: {
        stkCallback: {
          MerchantRequestID: 'ws_MR_123',
          CheckoutRequestID: 'ws_CO_123',
          ResultCode: 0,
          ResultDesc: 'Success',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 4900 },
              { Name: 'MpesaReceiptNumber', Value: 'PSPACE4900' },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    });

    expect(creditService.applyBalanceIncrement).not.toHaveBeenCalled();
    expect(creditService.invalidateBalanceCache).not.toHaveBeenCalled();
    expect(transactionClient.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.FAILED,
        }),
      }),
    );
    expect(smsService.sendMessage).not.toHaveBeenCalled();
  });

  it('marks non-cancelled failed callbacks without crediting the user', async () => {
    const { creditService, prismaService, service, smsService } = createPaymentService();
    const currentTransaction = {
      id: 'txn_1',
      amount: 5000,
      userId: 'user_1',
      metadata: {
        requestedPhoneNumber: '+254712345678',
      },
      phoneNumberHash: null,
      mpesaTransactionId: 'ws_CO_123',
      status: TransactionStatus.PENDING,
    };
    const transactionClient = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(currentTransaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaService.creditTransaction.findFirst.mockResolvedValue({
      id: 'txn_1',
      status: TransactionStatus.PENDING,
    });
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await service.handleMpesaCallback({
      Body: {
        stkCallback: {
          MerchantRequestID: 'ws_MR_123',
          CheckoutRequestID: 'ws_CO_123',
          ResultCode: 2001,
          ResultDesc: 'Insufficient funds',
        },
      },
    });

    expect(creditService.applyBalanceIncrement).not.toHaveBeenCalled();
    expect(transactionClient.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.FAILED,
        }),
      }),
    );
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254712345678',
      'Your PataSpace credit purchase failed: Insufficient funds',
    );
  });

  it('ignores callbacks for transactions that are already non-pending', async () => {
    const { creditService, prismaService, service } = createPaymentService();

    prismaService.creditTransaction.findFirst.mockResolvedValue({
      id: 'txn_1',
      status: TransactionStatus.COMPLETED,
    });

    await expect(
      service.handleMpesaCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'ws_MR_123',
            CheckoutRequestID: 'ws_CO_123',
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 5000 },
                { Name: 'MpesaReceiptNumber', Value: 'PSPACE5000' },
              ],
            },
          },
        },
      }),
    ).resolves.toEqual({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });

    expect(creditService.applyBalanceIncrement).not.toHaveBeenCalled();
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it('reconciles successful stale pending purchases when the callback is missed', async () => {
    const { creditService, mpesaClient, prismaService, service, smsService } =
      createPaymentService();
    const currentTransaction = {
      id: 'txn_1',
      amount: 5000,
      userId: 'user_1',
      metadata: {
        merchantRequestId: 'ws_MR_123',
        paymentAmountKES: 5000,
        requestedPhoneNumber: '+254712345678',
      },
      phoneNumberHash: null,
      mpesaTransactionId: 'ws_CO_123',
      status: TransactionStatus.PENDING,
    };
    const transactionClient = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(currentTransaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaService.creditTransaction.findMany.mockResolvedValue([
      {
        id: 'txn_1',
        metadata: currentTransaction.metadata,
        mpesaTransactionId: 'ws_CO_123',
      },
    ]);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    mpesaClient.queryStkPush.mockResolvedValue({
      checkoutRequestId: 'ws_CO_123',
      resultCode: 0,
      resultDesc: 'Success',
      mpesaReceiptNumber: 'PSPACE5000',
      phoneNumber: '+254712345678',
    });
    creditService.applyBalanceIncrement.mockResolvedValue({
      balanceBefore: 0,
      balanceAfter: 5000,
    });
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await expect(
      service.reconcilePendingPurchases(new Date('2026-03-24T08:10:00.000Z')),
    ).resolves.toBe(1);
    expect(mpesaClient.queryStkPush).toHaveBeenCalledWith({
      checkoutRequestId: 'ws_CO_123',
    });
    expect(creditService.applyBalanceIncrement).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        amount: 5000,
        userId: 'user_1',
      }),
    );
    expect(transactionClient.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mpesaReceiptNumber: 'PSPACE5000',
          status: TransactionStatus.COMPLETED,
        }),
        where: {
          id: 'txn_1',
        },
      }),
    );
  });

  it('reconciles stale pending purchases to failed when STK status reports a non-cancelled failure', async () => {
    const { creditService, mpesaClient, prismaService, service, smsService } =
      createPaymentService();
    const currentTransaction = {
      id: 'txn_1',
      amount: 5000,
      userId: 'user_1',
      metadata: {
        merchantRequestId: 'ws_MR_123',
        paymentAmountKES: 5000,
        requestedPhoneNumber: '+254712345678',
      },
      phoneNumberHash: null,
      mpesaTransactionId: 'ws_CO_123',
      status: TransactionStatus.PENDING,
    };
    const transactionClient = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(currentTransaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaService.creditTransaction.findMany.mockResolvedValue([
      {
        id: 'txn_1',
        metadata: currentTransaction.metadata,
        mpesaTransactionId: 'ws_CO_123',
      },
    ]);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    mpesaClient.queryStkPush.mockResolvedValue({
      checkoutRequestId: 'ws_CO_123',
      resultCode: 2001,
      resultDesc: 'Insufficient funds',
      mpesaReceiptNumber: null,
      phoneNumber: '+254712345678',
    });
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await expect(
      service.reconcilePendingPurchases(new Date('2026-03-24T08:10:00.000Z')),
    ).resolves.toBe(1);
    expect(creditService.applyBalanceIncrement).not.toHaveBeenCalled();
    expect(transactionClient.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.FAILED,
        }),
      }),
    );
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254712345678',
      'Your PataSpace credit purchase failed: Insufficient funds',
    );
  });

  it('reconciles stale pending purchases to cancelled when STK status reports cancellation', async () => {
    const { creditService, mpesaClient, prismaService, service, smsService } =
      createPaymentService();
    const currentTransaction = {
      id: 'txn_1',
      amount: 5000,
      userId: 'user_1',
      metadata: {
        merchantRequestId: 'ws_MR_123',
        paymentAmountKES: 5000,
        requestedPhoneNumber: '+254712345678',
      },
      phoneNumberHash: null,
      mpesaTransactionId: 'ws_CO_123',
      status: TransactionStatus.PENDING,
    };
    const transactionClient = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(currentTransaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaService.creditTransaction.findMany.mockResolvedValue([
      {
        id: 'txn_1',
        metadata: currentTransaction.metadata,
        mpesaTransactionId: 'ws_CO_123',
      },
    ]);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    mpesaClient.queryStkPush.mockResolvedValue({
      checkoutRequestId: 'ws_CO_123',
      resultCode: 1032,
      resultDesc: 'Request cancelled by user',
      mpesaReceiptNumber: null,
      phoneNumber: '+254712345678',
    });
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await expect(
      service.reconcilePendingPurchases(new Date('2026-03-24T08:10:00.000Z')),
    ).resolves.toBe(1);
    expect(creditService.applyBalanceIncrement).not.toHaveBeenCalled();
    expect(transactionClient.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.CANCELLED,
        }),
      }),
    );
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254712345678',
      'Your PataSpace credit purchase failed: Request cancelled by user',
    );
  });

  it('skips reconciliation updates when the STK status query fails', async () => {
    const { mpesaClient, prismaService, service } = createPaymentService();

    prismaService.creditTransaction.findMany.mockResolvedValue([
      {
        id: 'txn_1',
        metadata: {
          requestedPhoneNumber: '+254712345678',
        },
        mpesaTransactionId: 'ws_CO_123',
      },
    ]);
    mpesaClient.queryStkPush.mockRejectedValue(new Error('query timeout'));

    await expect(
      service.reconcilePendingPurchases(new Date('2026-03-24T08:10:00.000Z')),
    ).resolves.toBe(0);
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });
});
