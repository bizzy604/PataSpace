import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_PROVIDER } from './sms.constants';
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
        return provider === 'sandbox'
          ? new SandboxSmsProvider()
          : new DisabledSmsProvider(provider);
      },
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
