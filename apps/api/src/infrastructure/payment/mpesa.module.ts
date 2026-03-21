import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MPESA_PROVIDER } from './mpesa.constants';
import { MpesaClient } from './mpesa.client';
import { DisabledMpesaProvider } from './providers/disabled-mpesa.provider';
import { SandboxMpesaProvider } from './providers/sandbox-mpesa.provider';

@Global()
@Module({
  providers: [
    {
      provide: MPESA_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mode = configService.get<string>('infrastructure.mpesa.mode') ?? 'sandbox';
        return mode === 'sandbox' ? new SandboxMpesaProvider() : new DisabledMpesaProvider(mode);
      },
    },
    MpesaClient,
  ],
  exports: [MpesaClient],
})
export class MpesaModule {}
