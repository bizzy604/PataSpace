/**
 * Purpose: NestJS global module that wires the correct Stellar provider based on STELLAR_MODE config.
 * Why important: Single place to swap testnet/live/disabled without touching any consumer.
 * Used by: AppModule (auto-imported as global); stellar-purchase.service.ts via StellarClient
 */

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STELLAR_PROVIDER } from './stellar.constants';
import { StellarClient } from './stellar.client';
import { DisabledStellarProvider } from './providers/disabled-stellar.provider';
import { LiveStellarProvider } from './providers/live-stellar.provider';
import { TestnetStellarProvider } from './providers/testnet-stellar.provider';

@Global()
@Module({
  providers: [
    {
      provide: STELLAR_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mode = config.get<string>('infrastructure.stellar.mode') ?? 'disabled';
        const treasuryPublicKey = config.get<string>('infrastructure.stellar.treasuryPublicKey') ?? '';
        const horizonUrl = config.get<string>('infrastructure.stellar.horizonUrl') ?? 'https://horizon-testnet.stellar.org';

        if (mode === 'testnet') {
          const failPayment = config.get<boolean>('infrastructure.stellar.sandbox.failPayment') ?? false;
          return new TestnetStellarProvider(treasuryPublicKey, { failPayment });
        }

        if (mode === 'live') {
          return new LiveStellarProvider({ horizonUrl, treasuryPublicKey });
        }

        return new DisabledStellarProvider(mode);
      },
    },
    StellarClient,
  ],
  exports: [StellarClient],
})
export class StellarModule {}
