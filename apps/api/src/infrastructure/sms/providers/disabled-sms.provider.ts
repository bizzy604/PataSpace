import { SmsDispatchResult, SmsProvider } from '../sms.types';

export class DisabledSmsProvider implements SmsProvider {
  constructor(private readonly provider: string) {}

  async sendOtp(_phoneNumber: string, _code: string): Promise<SmsDispatchResult> {
    throw new Error(`${this.provider} SMS provider is not implemented yet.`);
  }

  async sendMessage(_phoneNumber: string, _message: string): Promise<SmsDispatchResult> {
    throw new Error(`${this.provider} SMS provider is not implemented yet.`);
  }

  async healthCheck() {
    return {
      status: 'degraded' as const,
      provider: this.provider,
      message: 'Live SMS integration is not implemented yet. Use sandbox mode during Sprint 0.',
    };
  }
}
