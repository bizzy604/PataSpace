import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { DatabaseModule } from './common/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
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
    DatabaseModule,
    CacheModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
