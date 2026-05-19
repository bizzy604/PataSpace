/**
 * Purpose: Unit tests for StellarPurchaseService — payment requests, reconciliation, error resilience.
 * Why important: Verifies delegation to StellarClient and PaymentFulfillmentService without network calls.
 * Used by: Jest test runner
 */

import { StellarPurchaseService } from './stellar-purchase.service';

describe('StellarPurchaseService', () => {
  const createService = () => {
    const prismaService = {
      creditTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const stellarClient = {
      createPaymentRequest: jest.fn().mockResolvedValue({
        destinationAddress: 'GABC_TREASURY_ADDRESS',
        memo: 'txn_1',
        amountXLM: '29.4117647',
        network: 'testnet',
      }),
      findIncomingPayment: jest.fn().mockResolvedValue(null),
    };

    const fulfillment = {
      processSuccessfulPayment: jest.fn().mockResolvedValue(undefined),
      processFailedPayment: jest.fn().mockResolvedValue(undefined),
    };

    const configService = {
      get: jest.fn().mockReturnValue(17),
    };

    const service = new StellarPurchaseService(
      prismaService as never,
      stellarClient as never,
      fulfillment as never,
      configService as never,
    );

    return { prismaService, stellarClient, fulfillment, configService, service };
  };

  describe('createPaymentRequest', () => {
    it('computes XLM amount from KES rate and delegates to stellarClient', async () => {
      const { service, stellarClient } = createService();

      const result = await service.createPaymentRequest('txn_1', { amountKES: 500 });

      expect(stellarClient.createPaymentRequest).toHaveBeenCalledWith({
        memo: 'txn_1',
        amountXLM: '29.4117647', // 500 / 17 = 29.4117647...
      });
      expect(result.stellarDestinationAddress).toBe('GABC_TREASURY_ADDRESS');
      expect(result.stellarMemo).toBe('txn_1');
      expect(result.stellarAmountXLM).toBe('29.4117647');
    });

    it('uses different KES amounts correctly', async () => {
      const { service, stellarClient } = createService();

      await service.createPaymentRequest('txn_2', { amountKES: 1000 });

      const call = stellarClient.createPaymentRequest.mock.calls[0][0];
      expect(call.amountXLM).toBe('58.8235294'); // 1000 / 17
    });
  });

  describe('reconcilePending', () => {
    it('returns zero when no pending transactions exist', async () => {
      const { service } = createService();
      const count = await service.reconcilePending(new Date());
      expect(count).toBe(0);
    });

    it('settles payment when Horizon finds a matching on-chain record', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();

      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      prismaService.creditTransaction.findMany.mockResolvedValue([
        { id: 'txn_settled', createdAt: twoMinutesAgo },
      ]);
      stellarClient.findIncomingPayment.mockResolvedValue({
        transactionHash: 'abc123_stellar_hash',
        from: 'GSENDER_ADDRESS',
        memo: 'txn_settled',
        settledAt: new Date().toISOString(),
      });

      const count = await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledWith('txn_settled', {
        amountPaid: null,
        stellarTransactionHash: 'abc123_stellar_hash',
      });
      expect(count).toBe(1);
    });

    it('expires payment after 30-minute timeout with no incoming payment', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();

      const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000);
      prismaService.creditTransaction.findMany.mockResolvedValue([
        { id: 'txn_expired', createdAt: thirtyFiveMinutesAgo },
      ]);
      stellarClient.findIncomingPayment.mockResolvedValue(null);

      const count = await service.reconcilePending(new Date());

      expect(fulfillment.processFailedPayment).toHaveBeenCalledWith(
        'txn_expired',
        -1,
        'Stellar payment not received within 30 minutes',
      );
      expect(count).toBe(1);
    });

    it('skips payment within timeout when no on-chain record exists yet', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      prismaService.creditTransaction.findMany.mockResolvedValue([
        { id: 'txn_waiting', createdAt: fiveMinutesAgo },
      ]);
      stellarClient.findIncomingPayment.mockResolvedValue(null);

      const count = await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).not.toHaveBeenCalled();
      expect(fulfillment.processFailedPayment).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });

    it('continues reconciling subsequent transactions when one throws', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();

      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      prismaService.creditTransaction.findMany.mockResolvedValue([
        { id: 'txn_error', createdAt: twoMinutesAgo },
        { id: 'txn_ok', createdAt: twoMinutesAgo },
      ]);
      stellarClient.findIncomingPayment
        .mockRejectedValueOnce(new Error('Horizon timeout'))
        .mockResolvedValueOnce({
          transactionHash: 'hash_ok_123',
          from: 'GSENDER_ADDRESS',
          memo: 'txn_ok',
          settledAt: new Date().toISOString(),
        });

      const count = await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledTimes(1);
      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledWith('txn_ok', expect.objectContaining({
        stellarTransactionHash: 'hash_ok_123',
      }));
      expect(count).toBe(1);
    });

    it('filters by userId when provided', async () => {
      const { service, prismaService } = createService();

      await service.reconcilePending(new Date(), 'user_123');

      const findManyCall = prismaService.creditTransaction.findMany.mock.calls[0][0];
      expect(findManyCall.where.userId).toBe('user_123');
    });
  });
});
