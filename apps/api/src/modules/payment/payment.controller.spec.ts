import { UnauthorizedException } from '@nestjs/common';
import { PaymentWebhookController } from './payment.controller';

describe('PaymentWebhookController', () => {
  const callbackPayload = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'mr_123',
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
  };

  const createController = (callbackSecret = '', environment = 'development') => {
    const paymentService = {
      handleMpesaCallback: jest.fn().mockResolvedValue({
        ResultCode: 0,
        ResultDesc: 'Accepted',
      }),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'infrastructure.mpesa.callbackSecret') {
          return callbackSecret;
        }

        if (key === 'app.environment') {
          return environment;
        }

        return undefined;
      }),
    };

    const commissionCallbackService = {
      handleB2CResult: jest.fn().mockResolvedValue({ kind: 'no_state_change', commissionId: 'c1' }),
    };

    const commissionTimeoutService = {
      handleB2CTimeout: jest.fn().mockResolvedValue({ kind: 'ignored' }),
    };

    return {
      controller: new PaymentWebhookController(
        paymentService as never,
        configService as never,
        commissionCallbackService as never,
        commissionTimeoutService as never,
      ),
      commissionCallbackService,
      commissionTimeoutService,
      paymentService,
    };
  };

  it('accepts sandbox callbacks when no secret is configured', async () => {
    const { controller, paymentService } = createController();

    await expect(
      controller.handleMpesaCallback(undefined, undefined, callbackPayload as never),
    ).resolves.toEqual({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
    expect(paymentService.handleMpesaCallback).toHaveBeenCalledWith(callbackPayload);
  });

  it('rejects callbacks with a missing shared secret when one is configured', async () => {
    const { controller } = createController('live-callback-secret-12345');

    expect(() =>
      controller.handleMpesaCallback(undefined, undefined, callbackPayload as never),
    ).toThrow(UnauthorizedException);
  });

  it('rejects callbacks in production when no secret is configured (fail closed)', () => {
    const { controller, paymentService } = createController('', 'production');

    expect(() =>
      controller.handleMpesaCallback(undefined, undefined, callbackPayload as never),
    ).toThrow(UnauthorizedException);
    expect(paymentService.handleMpesaCallback).not.toHaveBeenCalled();
  });

  it('accepts callbacks with the configured secret header', async () => {
    const { controller, paymentService } = createController('live-callback-secret-12345');

    await expect(
      controller.handleMpesaCallback(
        'live-callback-secret-12345',
        undefined,
        callbackPayload as never,
      ),
    ).resolves.toEqual({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
    expect(paymentService.handleMpesaCallback).toHaveBeenCalledWith(callbackPayload);
  });

  it('accepts callbacks with the configured token query parameter', async () => {
    const { controller, paymentService } = createController('live-callback-secret-12345');

    await expect(
      controller.handleMpesaCallback(
        undefined,
        'live-callback-secret-12345',
        callbackPayload as never,
      ),
    ).resolves.toEqual({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
    expect(paymentService.handleMpesaCallback).toHaveBeenCalledWith(callbackPayload);
  });

  it('routes authorized B2C queue-timeout callbacks to the timeout service', async () => {
    const { controller, commissionTimeoutService } = createController('live-callback-secret-12345');
    const timeoutPayload = {
      Result: { OriginatorConversationID: 'pataspace-1', ResultDesc: 'Timed out' },
    };

    await expect(
      controller.handleMpesaB2CTimeout(
        undefined,
        'live-callback-secret-12345',
        timeoutPayload as never,
      ),
    ).resolves.toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
    expect(commissionTimeoutService.handleB2CTimeout).toHaveBeenCalledWith(timeoutPayload);
  });

  it('rejects unauthorized B2C queue-timeout callbacks', async () => {
    const { controller, commissionTimeoutService } = createController('live-callback-secret-12345');

    await expect(
      controller.handleMpesaB2CTimeout(undefined, undefined, { Result: {} } as never),
    ).rejects.toThrow(UnauthorizedException);
    expect(commissionTimeoutService.handleB2CTimeout).not.toHaveBeenCalled();
  });
});
