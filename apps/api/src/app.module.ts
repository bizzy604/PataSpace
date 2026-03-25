import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiThrottlerGuard } from './common/throttling/api-throttler.guard';
import appConfig from './common/config/app.config';
import { validateEnv } from './common/config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ListingModule } from './modules/listing/listing.module';
import { CreditModule } from './modules/credit/credit.module';
import { UnlockModule } from './modules/unlock/unlock.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UploadModule } from './modules/upload/upload.module';
import { ConfirmationModule } from './modules/confirmation/confirmation.module';
import { DisputeModule } from './modules/dispute/dispute.module';
import { AdminModule } from './modules/admin/admin.module';
import { JobsModule } from './jobs/jobs.module';
import { DatabaseModule } from './common/database/database.module';
import { RequestContextModule } from './common/request-context/request-context.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { RedisService } from './infrastructure/cache/redis.service';
import { IdempotencyInterceptor } from './common/idempotency/idempotency.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RedisThrottlerStorage } from './common/throttling/redis-throttler.storage';
import { QueueModule } from './infrastructure/queue/queue.module';
import { SmsModule } from './infrastructure/sms/sms.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { MpesaModule } from './infrastructure/payment/mpesa.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env.local', 'apps/api/.env', '.env.local', '.env'],
      load: [appConfig],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [CacheModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: 'default',
            limit: Number(process.env.RATE_LIMIT_DEFAULT_LIMIT ?? 100),
            ttl: Number(process.env.RATE_LIMIT_DEFAULT_TTL_SECONDS ?? 60) * 1000,
            blockDuration: Number(process.env.RATE_LIMIT_DEFAULT_TTL_SECONDS ?? 60) * 1000,
          },
        ],
        storage: new RedisThrottlerStorage(redisService),
        setHeaders: false,
        getTracker: (request) => {
          if (request.user?.id) {
            return request.user.id;
          }

          return request.ip ?? 'unknown';
        },
        generateKey: (context, tracker, throttlerName) => {
          const request = context.switchToHttp().getRequest();
          const routePath = request.route?.path ?? request.url;

          return `${throttlerName}:${request.method}:${routePath}:${tracker}`;
        },
      }),
    }),
    RequestContextModule,
    DatabaseModule,
    CacheModule,
    QueueModule,
    SmsModule,
    StorageModule,
    MpesaModule,
    AuthModule,
    UserModule,
    ListingModule,
    CreditModule,
    UnlockModule,
    PaymentModule,
    UploadModule,
    ConfirmationModule,
    DisputeModule,
    AdminModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ApiThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
