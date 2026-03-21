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
        const publicBaseUrl =
          configService.get<string>('infrastructure.storage.publicBaseUrl') ??
          'http://localhost:3000/sandbox-storage';
        const cdnBaseUrl =
          configService.get<string>('infrastructure.storage.cdnBaseUrl') ?? publicBaseUrl;

        if (provider === 'sandbox') {
          return new SandboxStorageProvider({
            cdnBaseUrl,
            publicBaseUrl,
          });
        }

        if (provider === 's3') {
          return new S3StorageProvider({
            accessKeyId: configService.get<string>('infrastructure.storage.accessKeyId') ?? '',
            bucket: configService.get<string>('infrastructure.storage.bucket') ?? '',
            cdnBaseUrl,
            presignTtlSeconds:
              configService.get<number>('infrastructure.storage.presignTtlSeconds') ?? 900,
            publicBaseUrl,
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
