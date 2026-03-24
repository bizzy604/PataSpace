import { randomUUID } from 'crypto';
import { SmsProvider } from '../sms.types';

export class SandboxSmsProvider implements SmsProvider {
  constructor(
    private readonly behavior: {
      failMessage?: boolean;
      failOtp?: boolean;
    } = {},
  ) {}

  async sendOtp(_phoneNumber: string, _code: string) {
    if (this.behavior.failOtp) {
      throw new Error('Sandbox SMS OTP failure requested by configuration.');
    }

    return {
      provider: 'sandbox',
      messageId: `sms_${randomUUID()}`,
      accepted: true,
    };
  }

  async sendMessage(_phoneNumber: string, _message: string) {
    if (this.behavior.failMessage) {
      throw new Error('Sandbox SMS message failure requested by configuration.');
    }

    return {
      provider: 'sandbox',
      messageId: `sms_${randomUUID()}`,
      accepted: true,
    };
  }

  async healthCheck() {
    const hasFailureInjection = this.behavior.failOtp || this.behavior.failMessage;

    return {
      status: hasFailureInjection ? ('degraded' as const) : ('up' as const),
      provider: 'sandbox',
      message: hasFailureInjection
        ? 'Sandbox SMS adapter is active with failure injection enabled.'
        : 'Sandbox SMS adapter is active.',
    };
  }
}
