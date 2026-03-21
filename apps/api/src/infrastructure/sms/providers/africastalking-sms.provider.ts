import axios, { AxiosInstance } from 'axios';
import { SmsDispatchResult, SmsProvider } from '../sms.types';

type AfricasTalkingSmsConfig = {
  apiKey: string;
  baseUrl: string;
  username: string;
};

export class AfricasTalkingSmsProvider implements SmsProvider {
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly config: AfricasTalkingSmsConfig,
    httpClient?: AxiosInstance,
  ) {
    this.httpClient =
      httpClient ??
      axios.create({
        baseURL: this.config.baseUrl,
        timeout: 15000,
        headers: {
          Accept: 'application/json',
          apiKey: this.config.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
  }

  async sendOtp(phoneNumber: string, code: string) {
    return this.sendMessage(phoneNumber, `Your PataSpace OTP is ${code}. It expires in 5 minutes.`);
  }

  async sendMessage(phoneNumber: string, message: string): Promise<SmsDispatchResult> {
    const payload = new URLSearchParams({
      message,
      to: phoneNumber,
      username: this.config.username,
    });

    const response = await this.httpClient.post('/version1/messaging', payload.toString());
    const recipient = response.data?.SMSMessageData?.Recipients?.[0] ?? {};

    return {
      provider: 'africastalking',
      messageId: recipient.messageId ?? recipient.status ?? `at_${Date.now()}`,
      accepted:
        recipient.status === 'Success' ||
        recipient.statusCode === 101 ||
        response.status < 400,
    };
  }

  async healthCheck() {
    return {
      status: 'up' as const,
      provider: 'africastalking',
      message: 'Africa\'s Talking adapter configured.',
    };
  }
}
