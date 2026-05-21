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

type LiveMpesaConfig = {
  baseUrl: string;
  callbackUrl: string;
  consumerKey: string;
  consumerSecret: string;
  initiatorName: string;
  passkey: string;
  resultUrl: string;
  securityCredential: string;
  shortcode: string;
  timeoutUrl: string;
};

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
    const timestamp = this.getTimestamp();
    const password = Buffer.from(
      `${this.config.shortcode}${this.config.passkey}${timestamp}`,
    ).toString('base64');
    const accessToken = await this.getAccessToken();
    const response = await this.httpClient.post(
      '/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: this.config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(payload.amount),
        PartyA: this.toMpesaPhone(payload.phoneNumber),
        PartyB: this.config.shortcode,
        PhoneNumber: this.toMpesaPhone(payload.phoneNumber),
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
        PartyB: this.toMpesaPhone(payload.phoneNumber),
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

      const resultCode = Number(response.data?.ResultCode ?? -1);
      // Daraja returns 0 only when the transaction was located AND completed.
      // Any other code means it's still in flight, missing, or failed —
      // safer to surface as pending so the caller retries or re-queries.
      const outcome: MpesaB2CQueryResponse['outcome'] = resultCode === 0 ? 'success' : 'pending';

      return {
        outcome,
        conversationId: response.data?.ConversationID,
        mpesaReceiptNumber: response.data?.TransactionID ?? response.data?.MpesaReceiptNumber,
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
    const timestamp = this.getTimestamp();
    const password = Buffer.from(
      `${this.config.shortcode}${this.config.passkey}${timestamp}`,
    ).toString('base64');
    const accessToken = await this.getAccessToken();
    const response = await this.httpClient.post(
      '/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: this.config.shortcode,
        Password: password,
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
      responseCode: String(response.data.ResponseCode ?? '0'),
      resultCode: Number(response.data.ResultCode ?? 0),
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

  private getTimestamp() {
    const date = new Date();
    const parts = [
      date.getFullYear(),
      this.pad(date.getMonth() + 1),
      this.pad(date.getDate()),
      this.pad(date.getHours()),
      this.pad(date.getMinutes()),
      this.pad(date.getSeconds()),
    ];

    return parts.join('');
  }

  private pad(value: number) {
    return String(value).padStart(2, '0');
  }

  // Daraja requires 2547XXXXXXXX — strip leading '+' if present.
  private toMpesaPhone(phoneNumber: string): string {
    return phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
  }
}
