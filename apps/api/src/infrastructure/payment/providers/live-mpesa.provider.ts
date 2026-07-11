/**
 * Purpose: Real Daraja adapter: STK push, B2C payout, and status queries
 * against Safaricom's production/sandbox API with OAuth per call.
 * Why important: every shilling that moves in production moves through this
 * file; response mapping here decides what the rest of the system believes
 * about a payment. Request plumbing lives in live-mpesa.support.ts.
 * Used by: mpesa.module.ts (provider binding), MpesaClient consumers.
 */
import { Buffer } from 'buffer';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import {
  MpesaB2CQueryRequest,
  MpesaB2CQueryResponse,
  MpesaB2CRequest,
  MpesaB2CResponse,
  MpesaProvider,
  MpesaStkPushRequest,
  MpesaStkPushResponse,
  MpesaStkQueryRequest,
} from '../mpesa.types';
import {
  darajaTimestamp,
  LiveMpesaConfig,
  parseResultCode,
  stkPassword,
  toMpesaPhone,
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
    const timestamp = darajaTimestamp();
    const accessToken = await this.getAccessToken();
    const response = await this.httpClient.post(
      '/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: this.config.shortcode,
        Password: stkPassword(this.config.shortcode, this.config.passkey, timestamp),
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(payload.amount),
        PartyA: toMpesaPhone(payload.phoneNumber),
        PartyB: this.config.shortcode,
        PhoneNumber: toMpesaPhone(payload.phoneNumber),
        CallBackURL: this.config.callbackUrl,
        AccountReference: payload.accountReference,
        TransactionDesc: `PataSpace credits for ${payload.accountReference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return {
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
    };
  }

  async b2c(payload: MpesaB2CRequest): Promise<MpesaB2CResponse> {
    const accessToken = await this.getAccessToken();
    const originatorConversationId =
      payload.originatorConversationId ?? `pataspace_${Date.now()}`;
    const response = await this.httpClient.post(
      '/mpesa/b2c/v3/paymentrequest',
      {
        OriginatorConversationID: originatorConversationId,
        InitiatorName: this.config.initiatorName,
        SecurityCredential: this.config.securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Math.round(payload.amount),
        PartyA: this.config.shortcode,
        PartyB: toMpesaPhone(payload.phoneNumber),
        Remarks: payload.remarks ?? 'PataSpace commission payout',
        QueueTimeOutURL: this.config.timeoutUrl,
        ResultURL: this.config.resultUrl,
        Occasion: 'PataSpace payout',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return {
      conversationId: response.data.ConversationID,
      originatorConversationId:
        response.data.OriginatorConversationID ?? originatorConversationId,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
    };
  }

  async queryB2CTransaction(
    payload: MpesaB2CQueryRequest,
  ): Promise<MpesaB2CQueryResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.httpClient.post(
        '/mpesa/transactionstatus/v1/query',
        {
          Initiator: this.config.initiatorName,
          SecurityCredential: this.config.securityCredential,
          CommandID: 'TransactionStatusQuery',
          OriginatorConversationID: payload.originatorConversationId,
          PartyA: this.config.shortcode,
          IdentifierType: '4',
          Remarks: 'PataSpace payout status check',
          QueueTimeOutURL: this.config.timeoutUrl,
          ResultURL: this.config.resultUrl,
          Occasion: 'PataSpace payout status check',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
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
    const accessToken = await this.getAccessToken();
    const response = await this.httpClient.post(
      '/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: this.config.shortcode,
        Password: stkPassword(this.config.shortcode, this.config.passkey, timestamp),
        Timestamp: timestamp,
        CheckoutRequestID: payload.checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

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
