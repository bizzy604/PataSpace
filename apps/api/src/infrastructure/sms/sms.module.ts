import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_PROVIDER } from './sms.constants';
import { AfricasTalkingSmsProvider } from './providers/africastalking-sms.provider';
import { DisabledSmsProvider } from './providers/disabled-sms.provider';
import { SandboxSmsProvider } from './providers/sandbox-sms.provider';
import { SmsService } from './sms.service';

@Global()
@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('infrastructure.sms.provider') ?? 'sandbox';

        if (provider === 'sandbox') {
          return new SandboxSmsProvider();
        }

        if (provider === 'africastalking') {
          return new AfricasTalkingSmsProvider({
            apiKey: configService.get<string>('infrastructure.sms.apiKey') ?? '',
            baseUrl:
              configService.get<string>('infrastructure.sms.baseUrl') ??
              'https://api.africastalking.com',
            username: configService.get<string>('infrastructure.sms.username') ?? 'sandbox',
          });
        }

        return new DisabledSmsProvider(provider);
      },
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
