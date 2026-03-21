import { Inject, Injectable } from '@nestjs/common';
import { SMS_PROVIDER } from './sms.constants';
import { SmsProvider } from './sms.types';

@Injectable()
export class SmsService {
  constructor(
    @Inject(SMS_PROVIDER)
    private readonly provider: SmsProvider,
  ) {}

  async sendOtp(phoneNumber: string, code: string) {
    return this.provider.sendOtp(phoneNumber, code);
  }

  async sendMessage(phoneNumber: string, message: string) {
    return this.provider.sendMessage(phoneNumber, message);
  }

  async healthCheck() {
    return this.provider.healthCheck();
  }
}
