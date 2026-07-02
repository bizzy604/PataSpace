/**
 * Purpose: Unit tests for StellarPurchaseService — payment requests, reconciliation, amount verification.
 * Why important: Proves credits are granted only when the on-chain amount meets the quote,
 *   and verifies delegation to StellarClient and PaymentFulfillmentService without network calls.
 * Used by: Jest test runner
 */

import { StellarPurchaseService } from './stellar-purchase.service';

describe('StellarPurchaseService', () => {
  const createService = () => {
    const prismaService = {
      creditTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ metadata: {} }),
        update: jest.fn().mockResolvedValue(undefined),
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

  const pendingTx = (id: string, ageMs: number, amountXLM = '29.4117647') => ({
    id,
    createdAt: new Date(Date.now() - ageMs),
    metadata: { stellarAmountXLM: amountXLM, paymentAmountKES: 500 },
  });

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

    it('persists the quoted XLM amount onto the transaction metadata', async () => {
      const { service, prismaService } = createService();

      await service.createPaymentRequest('txn_1', { amountKES: 500 });

      const updateCall = prismaService.creditTransaction.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'txn_1' });
      expect(updateCall.data.metadata).toMatchObject({ stellarAmountXLM: '29.4117647' });
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

    it('passes the quoted amount to the provider lookup', async () => {
      const { service, prismaService, stellarClient } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingTx('txn_1', 2 * 60 * 1000)]);

      await service.reconcilePending(new Date());

      expect(stellarClient.findIncomingPayment).toHaveBeenCalledWith({
        memo: 'txn_1',
        expectedAmountXLM: '29.4117647',
      });
    });

    it('settles when the on-chain amount meets the quote', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingTx('txn_settled', 2 * 60 * 1000)]);
      stellarClient.findIncomingPayment.mockResolvedValue({
        transactionHash: 'abc123_stellar_hash',
        from: 'GSENDER_ADDRESS',
        memo: 'txn_settled',
        settledAt: new Date().toISOString(),
        amountXLM: '29.4117647',
      });

      const count = await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledWith('txn_settled', {
        amountPaid: null,
        stellarTransactionHash: 'abc123_stellar_hash',
      });
      expect(count).toBe(1);
    });

    it('settles when the on-chain amount slightly exceeds the quote', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingTx('txn_over', 2 * 60 * 1000)]);
      stellarClient.findIncomingPayment.mockResolvedValue({
        transactionHash: 'hash_over',
        from: 'GSENDER_ADDRESS',
        memo: 'txn_over',
        settledAt: new Date().toISOString(),
        amountXLM: '30.0000000',
      });

      await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledTimes(1);
      expect(fulfillment.processFailedPayment).not.toHaveBeenCalled();
    });

    it('REJECTS an underpayment and never grants credits', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingTx('txn_cheat', 2 * 60 * 1000)]);
      // Attacker sends a single stroop against a ~29 XLM quote.
      stellarClient.findIncomingPayment.mockResolvedValue({
        transactionHash: 'hash_cheat',
        from: 'GATTACKER',
        memo: 'txn_cheat',
        settledAt: new Date().toISOString(),
        amountXLM: '0.0000001',
      });

      const count = await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).not.toHaveBeenCalled();
      expect(fulfillment.processFailedPayment).toHaveBeenCalledWith(
        'txn_cheat',
        -2,
        expect.stringContaining('below the required'),
        { stellarTransactionHash: 'hash_cheat' },
      );
      expect(count).toBe(1);
    });

    it('does not grant credits when the amount is non-numeric', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingTx('txn_nan', 2 * 60 * 1000)]);
      stellarClient.findIncomingPayment.mockResolvedValue({
        transactionHash: 'hash_nan',
        from: 'GSENDER',
        memo: 'txn_nan',
        settledAt: new Date().toISOString(),
        amountXLM: 'not-a-number',
      });

      await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).not.toHaveBeenCalled();
      expect(fulfillment.processFailedPayment).toHaveBeenCalled();
    });

    it('falls back to the KES quote when stellarAmountXLM metadata is absent', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([
        { id: 'txn_legacy', createdAt: new Date(Date.now() - 2 * 60 * 1000), metadata: { paymentAmountKES: 500 } },
      ]);
      stellarClient.findIncomingPayment.mockResolvedValue({
        transactionHash: 'hash_legacy',
        from: 'GSENDER',
        memo: 'txn_legacy',
        settledAt: new Date().toISOString(),
        amountXLM: '29.4117647',
      });

      await service.reconcilePending(new Date());

      expect(stellarClient.findIncomingPayment).toHaveBeenCalledWith({
        memo: 'txn_legacy',
        expectedAmountXLM: '29.4117647',
      });
      expect(fulfillment.processSuccessfulPayment).toHaveBeenCalledTimes(1);
    });

    it('expires payment after 30-minute timeout with no incoming payment', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingTx('txn_expired', 35 * 60 * 1000)]);
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
      prismaService.creditTransaction.findMany.mockResolvedValue([pendingTx('txn_waiting', 5 * 60 * 1000)]);
      stellarClient.findIncomingPayment.mockResolvedValue(null);

      const count = await service.reconcilePending(new Date());

      expect(fulfillment.processSuccessfulPayment).not.toHaveBeenCalled();
      expect(fulfillment.processFailedPayment).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });

    it('continues reconciling subsequent transactions when one throws', async () => {
      const { service, prismaService, stellarClient, fulfillment } = createService();
      prismaService.creditTransaction.findMany.mockResolvedValue([
        pendingTx('txn_error', 2 * 60 * 1000),
        pendingTx('txn_ok', 2 * 60 * 1000),
      ]);
      stellarClient.findIncomingPayment
        .mockRejectedValueOnce(new Error('Horizon timeout'))
        .mockResolvedValueOnce({
          transactionHash: 'hash_ok_123',
          from: 'GSENDER_ADDRESS',
          memo: 'txn_ok',
          settledAt: new Date().toISOString(),
          amountXLM: '29.4117647',
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
