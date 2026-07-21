/**
 * Purpose: Gate tests for STK push execution: provider failure marks FAILED
 * with metadata preserved, while post-push bookkeeping failure leaves the
 * row PENDING (the prompt already reached the user's phone).
 * Why important: confusing those two failure classes either strands a paid
 * user (false FAILED) or loses the failure record entirely.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ServiceUnavailableException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { MpesaPurchaseService } from './mpesa-purchase.service';

describe('MpesaPurchaseService', () => {
  const packageConfig = { amountKES: 5000, credits: 5000, label: '5,000 credits package' };

  const createService = () => {
    const prismaService = {
      creditTransaction: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    const mpesaClient = {
      stkPush: jest.fn(),
    };
    const fulfillment = {
      processSuccessfulPayment: jest.fn(),
      processFailedPayment: jest.fn(),
      findPurchaseTransactionByLookup: jest.fn(),
    };

    return {
      fulfillment,
      mpesaClient,
      prismaService,
      service: new MpesaPurchaseService(
        prismaService as never,
        mpesaClient as never,
        fulfillment as never,
      ),
    };
  };

  it('records the checkout id and merged metadata after a successful push', async () => {
    const { mpesaClient, prismaService, service } = createService();
    mpesaClient.stkPush.mockResolvedValue({
      checkoutRequestId: 'ws_CO_1',
      merchantRequestId: 'ws_MR_1',
    });
    prismaService.creditTransaction.findUnique.mockResolvedValue({
      metadata: { paymentAmountKES: 5000 },
    });

    const result = await service.executeStkPush('tx_1', '+254712345678', packageConfig);

    expect(result).toEqual({ checkoutRequestId: 'ws_CO_1' });
    expect(prismaService.creditTransaction.update).toHaveBeenCalledWith({
      where: { id: 'tx_1' },
      data: {
        mpesaTransactionId: 'ws_CO_1',
        metadata: expect.objectContaining({
          paymentAmountKES: 5000,
          checkoutRequestId: 'ws_CO_1',
          merchantRequestId: 'ws_MR_1',
        }),
      },
    });
  });

  it('marks the row FAILED with merged metadata when the provider call fails', async () => {
    const { mpesaClient, prismaService, service } = createService();
    mpesaClient.stkPush.mockRejectedValue(new Error('daraja down'));
    prismaService.creditTransaction.findUnique.mockResolvedValue({
      metadata: {
        paymentAmountKES: 5000,
        requestedPhoneNumber: '+254712345678',
        packageKey: '5000_credits',
      },
    });

    await expect(
      service.executeStkPush('tx_1', '+254712345678', packageConfig),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(prismaService.creditTransaction.update).toHaveBeenCalledWith({
      where: { id: 'tx_1' },
      data: {
        status: TransactionStatus.FAILED,
        metadata: expect.objectContaining({
          paymentAmountKES: 5000,
          requestedPhoneNumber: '+254712345678',
          packageKey: '5000_credits',
          failureReason: 'daraja down',
        }),
      },
    });
  });

  it('leaves the row PENDING when only the post-push bookkeeping fails', async () => {
    const { mpesaClient, prismaService, service } = createService();
    mpesaClient.stkPush.mockResolvedValue({
      checkoutRequestId: 'ws_CO_1',
      merchantRequestId: 'ws_MR_1',
    });
    // Both bookkeeping attempts fail — the prompt is already on the phone.
    prismaService.creditTransaction.findUnique.mockRejectedValue(new Error('db down'));

    const result = await service.executeStkPush('tx_1', '+254712345678', packageConfig);

    expect(result).toEqual({ checkoutRequestId: 'ws_CO_1' });
    const failedWrites = prismaService.creditTransaction.update.mock.calls.filter(
      ([arg]: [{ data?: { status?: string } }]) => arg.data?.status === TransactionStatus.FAILED,
    );
    expect(failedWrites).toHaveLength(0);
  });

  it('retries the bookkeeping write once before giving up', async () => {
    const { mpesaClient, prismaService, service } = createService();
    mpesaClient.stkPush.mockResolvedValue({
      checkoutRequestId: 'ws_CO_1',
      merchantRequestId: 'ws_MR_1',
    });
    prismaService.creditTransaction.findUnique.mockResolvedValue({ metadata: {} });
    prismaService.creditTransaction.update
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce({});

    await service.executeStkPush('tx_1', '+254712345678', packageConfig);

    expect(prismaService.creditTransaction.update).toHaveBeenCalledTimes(2);
  });

  it('still raises MPESA_UNAVAILABLE when the failure marking itself fails', async () => {
    const { mpesaClient, prismaService, service } = createService();
    mpesaClient.stkPush.mockRejectedValue(new Error('daraja down'));
    prismaService.creditTransaction.findUnique.mockRejectedValue(new Error('db down'));

    await expect(
      service.executeStkPush('tx_1', '+254712345678', packageConfig),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
