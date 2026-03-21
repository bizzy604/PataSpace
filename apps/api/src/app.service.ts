import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './common/database/prisma.service';
import { MpesaClient } from './infrastructure/payment/mpesa.client';
import { SmsService } from './infrastructure/sms/sms.service';
import { StorageService } from './infrastructure/storage/storage.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly storageService: StorageService,
    private readonly mpesaClient: MpesaClient,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      service: this.configService.get<string>('app.name') ?? 'pataspace-api',
      environment: this.configService.get<string>('app.environment') ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const [database, sms, storage, mpesa] = await Promise.all([
      this.checkDatabase(),
      this.smsService.healthCheck(),
      this.storageService.healthCheck(),
      this.mpesaClient.healthCheck(),
    ]);

    const status =
      database.status === 'up' &&
      sms.status !== 'down' &&
      storage.status !== 'down' &&
      mpesa.status !== 'down'
        ? 'ready'
        : 'degraded';

    return {
      status,
      service: this.configService.get<string>('app.name') ?? 'pataspace-api',
      timestamp: new Date().toISOString(),
      components: {
        database,
        sms,
        storage,
        mpesa,
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.prismaService.$queryRawUnsafe('SELECT 1');

      return {
        status: 'up' as const,
      };
    } catch (error) {
      return {
        status: 'down' as const,
        message: error instanceof Error ? error.message : 'Database connectivity check failed',
      };
    }
  }
}
