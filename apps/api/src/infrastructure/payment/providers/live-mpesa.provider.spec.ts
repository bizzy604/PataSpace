/**
 * Purpose: Gate tests for the live Daraja adapter's response mapping —
 * above all that a missing/unparseable ResultCode maps to null, never 0.
 * Why important: reconciliation settles purchases off these mappings; a
 * defaulted ResultCode of 0 would grant credits for unconfirmed payments.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { MpesaDuplicateSubmissionError } from '../mpesa.types';
import { LiveMpesaProvider } from './live-mpesa.provider';
import { isDuplicateSubmissionResponse, parseResultCode } from './live-mpesa.support';

describe('LiveMpesaProvider', () => {
  const config = {
    baseUrl: 'https://daraja.test',
    callbackUrl: 'https://api.test/api/v1/payments/mpesa-callback',
    consumerKey: 'key',
    consumerSecret: 'secret',
    initiatorName: 'tester',
    passkey: 'passkey',
    resultUrl: 'https://api.test/api/v1/payments/mpesa-b2c-callback',
    securityCredential: 'credential',
    shortcode: '600000',
    timeoutUrl: 'https://api.test/api/v1/payments/mpesa-b2c-callback',
  };

  const createProvider = () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({ data: { access_token: 'token' } }),
      post: jest.fn(),
    };

    return {
      httpClient,
      provider: new LiveMpesaProvider(config, httpClient as never),
    };
  };

  describe('queryStkPush result-code mapping', () => {
    it('maps a missing ResultCode to null, never to success', async () => {
      const { httpClient, provider } = createProvider();
      httpClient.post.mockResolvedValue({
        data: { ResponseCode: '0', ResponseDescription: 'Accepted' },
      });

      const result = await provider.queryStkPush({ checkoutRequestId: 'ws_CO_1' });

      expect(result.resultCode).toBeNull();
    });

    it('maps an unparseable ResultCode to null', async () => {
      const { httpClient, provider } = createProvider();
      httpClient.post.mockResolvedValue({
        data: { ResponseCode: '0', ResultCode: 'not-a-number' },
      });

      const result = await provider.queryStkPush({ checkoutRequestId: 'ws_CO_1' });

      expect(result.resultCode).toBeNull();
    });

    it('passes explicit result codes through, including 0 and failures', async () => {
      const { httpClient, provider } = createProvider();

      httpClient.post.mockResolvedValueOnce({
        data: { ResultCode: 0, ResultDesc: 'Processed' },
      });
      await expect(
        provider.queryStkPush({ checkoutRequestId: 'ws_CO_1' }),
      ).resolves.toMatchObject({ resultCode: 0 });

      httpClient.post.mockResolvedValueOnce({
        data: { ResultCode: '1032', ResultDesc: 'Cancelled by user' },
      });
      await expect(
        provider.queryStkPush({ checkoutRequestId: 'ws_CO_1' }),
      ).resolves.toMatchObject({ resultCode: 1032, resultDesc: 'Cancelled by user' });
    });
  });

  describe('queryB2CTransaction', () => {
    it('treats the ResultCode-less synchronous ack as pending', async () => {
      const { httpClient, provider } = createProvider();
      httpClient.post.mockResolvedValue({
        data: {
          ConversationID: 'AG_1',
          ResponseCode: '0',
          ResponseDescription: 'Accept the service request successfully.',
        },
      });

      const result = await provider.queryB2CTransaction({
        originatorConversationId: 'pataspace-1',
      });

      expect(result.outcome).toBe('pending');
    });

    it('reports success only on an explicit ResultCode of 0', async () => {
      const { httpClient, provider } = createProvider();
      httpClient.post.mockResolvedValue({
        data: { ResultCode: 0, TransactionID: 'RCPT1', ResultDesc: 'Completed' },
      });

      const result = await provider.queryB2CTransaction({
        originatorConversationId: 'pataspace-1',
      });

      expect(result).toMatchObject({ outcome: 'success', mpesaReceiptNumber: 'RCPT1' });
    });
  });

  describe('stkPush request shaping', () => {
    it('strips the leading + from the MSISDN and rounds the amount', async () => {
      const { httpClient, provider } = createProvider();
      httpClient.post.mockResolvedValue({
        data: {
          CheckoutRequestID: 'ws_CO_1',
          MerchantRequestID: 'ws_MR_1',
          ResponseCode: '0',
          ResponseDescription: 'Accepted',
        },
      });

      await provider.stkPush({
        phoneNumber: '+254712345678',
        amount: 5000,
        accountReference: 'tx_1',
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/mpesa/stkpush/v1/processrequest',
        expect.objectContaining({
          Amount: 5000,
          PartyA: '254712345678',
          PhoneNumber: '254712345678',
        }),
        expect.anything(),
      );
    });
  });

  describe('b2c duplicate-submission mapping', () => {
    const axiosError = (data: unknown) =>
      Object.assign(new Error('Request failed with status code 400'), {
        isAxiosError: true,
        response: { status: 400, data },
      });

    it('maps a duplicate OriginatorConversationID rejection to its own error type', async () => {
      const { httpClient, provider } = createProvider();
      httpClient.post.mockRejectedValue(
        axiosError({ errorMessage: 'Duplicate OriginatorConversationID', errorCode: '500.002.1001' }),
      );

      await expect(
        provider.b2c({ phoneNumber: '+254712345678', amount: 750, originatorConversationId: 'pataspace-1' }),
      ).rejects.toBeInstanceOf(MpesaDuplicateSubmissionError);
    });

    it('rethrows other b2c errors untouched', async () => {
      const { httpClient, provider } = createProvider();
      httpClient.post.mockRejectedValue(axiosError({ errorMessage: 'Insufficient funds' }));

      await expect(
        provider.b2c({ phoneNumber: '+254712345678', amount: 750, originatorConversationId: 'pataspace-1' }),
      ).rejects.toThrow('Request failed with status code 400');
    });
  });

  describe('isDuplicateSubmissionResponse', () => {
    it.each([
      [{ errorMessage: 'Duplicate OriginatorConversationID' }, true],
      [{ errorMessage: 'The Originator Conversation ID is duplicate.' }, true],
      [{ ResponseDescription: 'DUPLICATE originatorConversationId detected' }, true],
      [{ errorMessage: 'Insufficient funds' }, false],
      [{ errorMessage: 'Duplicate request' }, false],
      [null, false],
      ['duplicate', false],
    ])('classifies %j as %p', (body, expected) => {
      expect(isDuplicateSubmissionResponse(body)).toBe(expected);
    });
  });

  describe('parseResultCode', () => {
    it.each([
      [undefined, null],
      [null, null],
      ['', null],
      ['garbage', null],
      [0, 0],
      ['0', 0],
      [1032, 1032],
      ['2001', 2001],
    ])('maps %p to %p', (raw, expected) => {
      expect(parseResultCode(raw)).toBe(expected);
    });
  });
});
