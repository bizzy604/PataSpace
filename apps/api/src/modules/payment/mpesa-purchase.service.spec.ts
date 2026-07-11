/**
 * Purpose: Gate tests for M-Pesa purchase reconciliation and STK failure
 * handling: indeterminate query results must not settle, metadata must
 * survive failure marking, and one bad row must not stop the sweep.
 * Why important: these paths decide when credits are granted from Daraja
 * state; the regressions covered here grant or destroy money silently.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ServiceUnavailableException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { MpesaPurchaseService } from './mpesa-purchase.service';

describe('MpesaPurchaseService', () => {
  const createService = () => {
    const prismaService = {
      creditTransaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    const mpesaClient = {
      stkPush: jest.fn(),
      queryStkPush: jest.fn(),
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

  const pendingRow = (overrides = {}) => ({
    id: 'tx_1',
    mpesaTransactionId: 'ws_CO_1',
    metadata: {
      paymentAmountKES: 5000,
      requestedPhoneNumber: '+254712345678',
    },
    ...overrides,
  });

  describe('executeStkPush failure marking', () => {
    it('merges the failure reason into existing metadata instead of replacing it', async () => {
      const { mpesaClient, prismaService, service } = createService();
      mpesaClient.stkPush.mockRejectedValue(new Error('daraja down'));
      prismaService.creditTransaction.findUnique.mockResolvedValue({
        metadata: {
          paymentAmountKES: 5000,
          requestedPhoneNumber: '+254712345678',
          packageKey: '5_credits',
        },
      });

      await expect(
        service.executeStkPush('tx_1', '+254712345678', {
          amountKES: 5000,
          credits: 5000,
          label: '5,000 credits package',
        }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);

      expect(prismaService.creditTransaction.update).toHaveBeenCalledWith({
        where: { id: 'tx_1' },
        data: {
          status: TransactionStatus.FAILED,
          metadata: expect.objectContaining({
            paymentAmountKES: 5000,
            requestedPhoneNumber: '+254712345678',
            packageKey: '5_credits',
            failureReason: 'daraja down',
          }),
        },
      });
    });

    it('still raises MPESA_UNAVAILABLE when the failure marking itself fails', async () => {
      const { mpesaClient, prismaService, service } = createService();
      mpesaClient.stkPush.mockRejectedValue(new Error('daraja down'));
      prismaService.creditTransaction.findUnique.mockRejectedValue(new Error('db down'));

      await expect(
        service.executeStkPush('tx_1', '+254712345678', {
          amountKES: 5000,
          credits: 5000,
          label: '5,000 credits package',
        }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('reconcilePending', () => {
    it('leaves the row pending when Daraja returns no result code', async () => {
      const { fulfillment, mpesaClient, prismaService, service } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingRow()]);
      mpesaClient.queryStkPush.mockResolvedValue({
        checkoutRequestId: 'ws_CO_1',
        responseCode: '0',
        resultCode: null,
        resultDesc: 'The transaction is being processed',
      });

      const count = await service.reconcilePending(new Date());

      expect(count).toBe(0);
      expect(fulfillment.processSuccessfulPayment).not.toHaveBeenCalled();
      expect(fulfillment.processFailedPayment).not.toHaveBeenCalled();
    });

    it('leaves the row pending on success when the expected amount is unknown', async () => {
      const { fulfillment, mpesaClient, prismaService, service } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([
        pendingRow({ metadata: {} }),
      ]);
      mpesaClient.queryStkPush.mockResolvedValue({
        checkoutRequestId: 'ws_CO_1',
        responseCode: '0',
        resultCode: 0,
        resultDesc: 'Processed',
      });

      const count = await service.reconcilePending(new Date());

      expect(count).toBe(0);
      expect(fulfillment.processSuccessfulPayment).not.toHaveBeenCalled();
      expect(fulfillment.processFailedPayment).not.toHaveBeenCalled();
    });

    it('settles success and failure outcomes from explicit result codes', async () => {
      const { fulfillment, mpesaClient, prismaService, service } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([
        pendingRow(),
        pendingRow({ id: 'tx_2', mpesaTransactionId: 'ws_CO_2' }),
      ]);
      mpesaClient.queryStkPush
        .mockResolvedValueOnce({
          checkoutRequestId: 'ws_CO_1',
          responseCode: '0',
          resultCode: 0,
          resultDesc: 'Processed',
        })
        .mockResolvedValueOnce({
          checkoutRequestId: 'ws_CO_2',
          responseCode: '0',
          resultCode: 1032,
          resultDesc: 'Cancelled by user',
        });

      const count = await service.reconcilePending(new Date());

      expect(count).toBe(2);
      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledWith(
        'tx_1',
        expect.objectContaining({ amountPaid: 5000 }),
      );
      expect(fulfillment.processFailedPayment).toHaveBeenCalledWith(
        'tx_2',
        1032,
        'Cancelled by user',
        expect.anything(),
      );
    });

    it('continues the sweep when one query fails', async () => {
      const { fulfillment, mpesaClient, prismaService, service } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([
        pendingRow(),
        pendingRow({ id: 'tx_2', mpesaTransactionId: 'ws_CO_2' }),
      ]);
      mpesaClient.queryStkPush
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce({
          checkoutRequestId: 'ws_CO_2',
          responseCode: '0',
          resultCode: 0,
          resultDesc: 'Processed',
        });

      const count = await service.reconcilePending(new Date());

      expect(count).toBe(1);
      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledWith(
        'tx_2',
        expect.anything(),
      );
    });

    it('skips rows that never received a checkout request id', async () => {
      const { fulfillment, mpesaClient, prismaService, service } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([
        pendingRow({ mpesaTransactionId: null }),
      ]);

      const count = await service.reconcilePending(new Date());

      expect(count).toBe(0);
      expect(mpesaClient.queryStkPush).not.toHaveBeenCalled();
      expect(fulfillment.processSuccessfulPayment).not.toHaveBeenCalled();
    });
  });
});
