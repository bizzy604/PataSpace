import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.constants';
import { DisabledStorageProvider } from './providers/disabled-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
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

        if (provider === 'sandbox') {
          return new SandboxStorageProvider();
        }

        if (provider === 's3') {
          return new S3StorageProvider({
            accessKeyId: configService.get<string>('infrastructure.storage.accessKeyId') ?? '',
            bucket: configService.get<string>('infrastructure.storage.bucket') ?? '',
            presignTtlSeconds:
              configService.get<number>('infrastructure.storage.presignTtlSeconds') ?? 900,
            region: configService.get<string>('infrastructure.storage.region') ?? 'eu-west-1',
            secretAccessKey:
              configService.get<string>('infrastructure.storage.secretAccessKey') ?? '',
          });
        }

        return new DisabledStorageProvider(provider);
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
