/**
 * Purpose: Gate tests for M-Pesa purchase reconciliation: conservative
 * settlement from Daraja state, sweep resilience, and the expiry of rows
 * whose STK push never completed (which unblocks the user's purchases).
 * Why important: these paths decide when credits are granted or a stuck
 * purchase is released; a regression grants money or bricks purchasing.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { MpesaReconcileService } from './mpesa-reconcile.service';

describe('MpesaReconcileService', () => {
  const createService = () => {
    const prismaService = {
      creditTransaction: {
        findMany: jest.fn(),
      },
    };
    const mpesaClient = {
      queryStkPush: jest.fn(),
    };
    const fulfillment = {
      processSuccessfulPayment: jest.fn(),
      processFailedPayment: jest.fn(),
    };

    return {
      fulfillment,
      mpesaClient,
      prismaService,
      service: new MpesaReconcileService(
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

  it('expires rows that never received a checkout request id, releasing the user', async () => {
    const { fulfillment, mpesaClient, prismaService, service } = createService();
    prismaService.creditTransaction.findMany.mockResolvedValue([
      pendingRow({ mpesaTransactionId: null }),
    ]);

    const count = await service.reconcilePending(new Date());

    expect(count).toBe(1);
    expect(mpesaClient.queryStkPush).not.toHaveBeenCalled();
    expect(fulfillment.processFailedPayment).toHaveBeenCalledWith(
      'tx_1',
      -3,
      expect.stringContaining('no CheckoutRequestID recorded'),
    );
  });

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
});
