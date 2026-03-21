import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MPESA_PROVIDER } from './mpesa.constants';
import { MpesaClient } from './mpesa.client';
import { DisabledMpesaProvider } from './providers/disabled-mpesa.provider';
import { LiveMpesaProvider } from './providers/live-mpesa.provider';
import { SandboxMpesaProvider } from './providers/sandbox-mpesa.provider';

@Global()
@Module({
  providers: [
    {
      provide: MPESA_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mode = configService.get<string>('infrastructure.mpesa.mode') ?? 'sandbox';

        if (mode === 'sandbox') {
          return new SandboxMpesaProvider();
        }

        if (mode === 'live') {
          return new LiveMpesaProvider({
            baseUrl: configService.get<string>('infrastructure.mpesa.baseUrl') ?? '',
            callbackUrl: configService.get<string>('infrastructure.mpesa.callbackUrl') ?? '',
            consumerKey: configService.get<string>('infrastructure.mpesa.consumerKey') ?? '',
            consumerSecret:
              configService.get<string>('infrastructure.mpesa.consumerSecret') ?? '',
            initiatorName:
              configService.get<string>('infrastructure.mpesa.initiatorName') ?? '',
            passkey: configService.get<string>('infrastructure.mpesa.passkey') ?? '',
            resultUrl: configService.get<string>('infrastructure.mpesa.resultUrl') ?? '',
            securityCredential:
              configService.get<string>('infrastructure.mpesa.securityCredential') ?? '',
            shortcode: configService.get<string>('infrastructure.mpesa.shortcode') ?? '',
            timeoutUrl: configService.get<string>('infrastructure.mpesa.timeoutUrl') ?? '',
          });
        }

        return new DisabledMpesaProvider(mode);
      },
    },
    MpesaClient,
  ],
  exports: [MpesaClient],
})
export class MpesaModule {}
