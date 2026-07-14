/**
 * Purpose: Real Daraja adapter: STK push, B2C payout, and status queries
 * against Safaricom's production/sandbox API with OAuth per call.
 * Why important: every shilling that moves in production moves through this
 * file; response mapping here decides what the rest of the system believes
 * about a payment. Request bodies and parsing live in live-mpesa.support.ts.
 * Used by: mpesa.module.ts (provider binding), MpesaClient consumers.
 */
import { Buffer } from 'buffer';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import {
  MpesaB2CQueryRequest,
  MpesaB2CQueryResponse,
  MpesaB2CRequest,
  MpesaB2CResponse,
  MpesaDuplicateSubmissionError,
  MpesaProvider,
  MpesaStkPushRequest,
  MpesaStkPushResponse,
  MpesaStkQueryRequest,
} from '../mpesa.types';
import {
  buildB2CBody,
  buildStkPushBody,
  buildTransactionStatusBody,
  darajaTimestamp,
  isDuplicateSubmissionResponse,
  LiveMpesaConfig,
  parseResultCode,
  stkPassword,
} from './live-mpesa.support';

export class LiveMpesaProvider implements MpesaProvider {
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly config: LiveMpesaConfig,
    httpClient?: AxiosInstance,
  ) {
    this.httpClient =
      httpClient ??
      axios.create({
        baseURL: this.config.baseUrl,
        timeout: 15000,
      });
  }

  async stkPush(payload: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    const response = await this.post(
      '/mpesa/stkpush/v1/processrequest',
      buildStkPushBody(this.config, payload, darajaTimestamp()),
    );

    return {
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
    };
  }

  async b2c(payload: MpesaB2CRequest): Promise<MpesaB2CResponse> {
    const originatorConversationId =
      payload.originatorConversationId ?? `pataspace_${Date.now()}`;

    try {
      const response = await this.post(
        '/mpesa/b2c/v3/paymentrequest',
        buildB2CBody(this.config, payload, originatorConversationId),
      );

      return {
        conversationId: response.data.ConversationID,
        originatorConversationId:
          response.data.OriginatorConversationID ?? originatorConversationId,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
      };
    } catch (error) {
      // A duplicate-id rejection means the original submission is in flight
      // or settled — surface it as its own type so the payout flow waits for
      // the settlement result instead of retrying or dead-lettering.
      if (isAxiosError(error) && isDuplicateSubmissionResponse(error.response?.data)) {
        throw new MpesaDuplicateSubmissionError();
      }
      throw error;
    }
  }

  async queryB2CTransaction(
    payload: MpesaB2CQueryRequest,
  ): Promise<MpesaB2CQueryResponse> {
    try {
      const response = await this.post(
        '/mpesa/transactionstatus/v1/query',
        buildTransactionStatusBody(this.config, payload.originatorConversationId),
      );

      // The transaction-status API is itself async: this synchronous ack
      // normally carries no ResultCode (the real result lands on the
      // ResultURL later), so the common path here is 'pending'. Only an
      // explicit 0 in the ack may read as success; anything else stays
      // 'pending' so the caller re-queries or re-issues with the same
      // OriginatorConversationID.
      const resultCode = parseResultCode(response.data?.ResultCode);
      const outcome: MpesaB2CQueryResponse['outcome'] =
        resultCode === 0 ? 'success' : 'pending';

      return {
        outcome,
        conversationId: response.data?.ConversationID,
        mpesaReceiptNumber:
          response.data?.TransactionID ?? response.data?.MpesaReceiptNumber,
        resultDesc:
          response.data?.ResultDesc ?? response.data?.ResponseDescription,
      };
    } catch (error) {
      // 404-style failures from Daraja mean "not found", which we cannot
      // distinguish from a B2C that was never accepted — caller should retry.
      if (isAxiosError(error) && error.response?.status === 404) {
        return { outcome: 'pending' };
      }
      throw error;
    }
  }

  async queryStkPush(payload: MpesaStkQueryRequest) {
    const timestamp = darajaTimestamp();
    const response = await this.post('/mpesa/stkpushquery/v1/query', {
      BusinessShortCode: this.config.shortcode,
      Password: stkPassword(this.config.shortcode, this.config.passkey, timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: payload.checkoutRequestId,
    });

    return {
      checkoutRequestId: payload.checkoutRequestId,
      responseCode: String(response.data.ResponseCode ?? ''),
      resultCode: parseResultCode(response.data.ResultCode),
      resultDesc:
        (response.data.ResultDesc as string | undefined) ??
        (response.data.ResponseDescription as string | undefined) ??
        'STK query completed',
    };
  }

  async healthCheck() {
    try {
      await this.getAccessToken();

      return {
        status: 'up' as const,
        provider: 'live',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        provider: 'live',
        message: error instanceof Error ? error.message : 'M-Pesa credential check failed',
      };
    }
  }

  private async post(path: string, body: Record<string, unknown>) {
    const accessToken = await this.getAccessToken();

    return this.httpClient.post(path, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  private async getAccessToken() {
    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`,
    ).toString('base64');
    const response = await this.httpClient.get('/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token as string;
  }
}
