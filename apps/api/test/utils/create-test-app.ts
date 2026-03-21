import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import { SmsService } from '../../src/infrastructure/sms/sms.service';
import { StorageService } from '../../src/infrastructure/storage/storage.service';
import { MpesaClient } from '../../src/infrastructure/payment/mpesa.client';

type TestAppOptions = {
  databaseHealth?: {
    shouldFail?: boolean;
  };
  smsHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
  storageHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
  mpesaHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
};

export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      $queryRawUnsafe: options.databaseHealth?.shouldFail
        ? jest.fn().mockRejectedValue(new Error('database unavailable'))
        : jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    })
    .overrideProvider(SmsService)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({
        status: options.smsHealth?.status ?? 'up',
        provider: options.smsHealth?.provider ?? 'sandbox',
      }),
    })
    .overrideProvider(StorageService)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({
        status: options.storageHealth?.status ?? 'up',
        provider: options.storageHealth?.provider ?? 'sandbox',
      }),
    })
    .overrideProvider(MpesaClient)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({
        status: options.mpesaHealth?.status ?? 'up',
        provider: options.mpesaHealth?.provider ?? 'sandbox',
      }),
    })
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return app;
}
