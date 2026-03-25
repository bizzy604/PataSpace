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

  const createController = (callbackSecret = '') => {
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

        return undefined;
      }),
    };

    return {
      controller: new PaymentWebhookController(
        paymentService as never,
        configService as never,
      ),
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
});
