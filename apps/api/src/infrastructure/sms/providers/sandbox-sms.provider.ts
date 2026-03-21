import { randomUUID } from 'crypto';
import { SmsProvider } from '../sms.types';

export class SandboxSmsProvider implements SmsProvider {
  async sendOtp(_phoneNumber: string, _code: string) {
    return {
      provider: 'sandbox',
      messageId: `sms_${randomUUID()}`,
      accepted: true,
    };
  }

  async sendMessage(_phoneNumber: string, _message: string) {
    return {
      provider: 'sandbox',
      messageId: `sms_${randomUUID()}`,
      accepted: true,
    };
  }

  async healthCheck() {
    return {
      status: 'up' as const,
      provider: 'sandbox',
      message: 'Sandbox SMS adapter is active.',
    };
  }
}
