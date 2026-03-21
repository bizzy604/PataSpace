import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.constants';
import { DisabledStorageProvider } from './providers/disabled-storage.provider';
import { SandboxStorageProvider } from './providers/sandbox-storage.provider';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('infrastructure.storage.provider') ?? 'sandbox';
        return provider === 'sandbox'
          ? new SandboxStorageProvider()
          : new DisabledStorageProvider(provider);
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
