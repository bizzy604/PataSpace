import { Buffer } from 'buffer';
import axios, { AxiosInstance } from 'axios';
import {
  MpesaB2CRequest,
  MpesaB2CResponse,
  MpesaProvider,
  MpesaStkPushRequest,
  MpesaStkPushResponse,
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
        PartyA: payload.phoneNumber,
        PartyB: this.config.shortcode,
        PhoneNumber: payload.phoneNumber,
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
    const response = await this.httpClient.post(
      '/mpesa/b2c/v3/paymentrequest',
      {
        OriginatorConversationID: `pataspace_${Date.now()}`,
        InitiatorName: this.config.initiatorName,
        SecurityCredential: this.config.securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Math.round(payload.amount),
        PartyA: this.config.shortcode,
        PartyB: payload.phoneNumber,
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
      originatorConversationId: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
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
}
