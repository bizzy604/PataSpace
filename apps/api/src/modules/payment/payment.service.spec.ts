import { ServiceUnavailableException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const createStoredUser = () => ({
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
  });

  const createPaymentService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      creditTransaction: {
        updateMany: jest.fn(),
        findFirst: jest.fn(),
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
});
