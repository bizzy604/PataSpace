/**
 * Purpose: Wires the email infrastructure into the API module graph.
 * Why important: Delivery logic should be injectable and configurable without
 *   reaching into providers from use-case services.
 * Used by: AppModule and any future transactional email use cases.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { SandboxEmailProvider } from './providers/sandbox-email.provider';

const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('infrastructure.email.provider') ?? 'sandbox';

        if (provider === 'resend') {
          return new ResendEmailProvider(configService);
        }

        return new SandboxEmailProvider();
      },
    },
    {
      provide: EmailService,
      useFactory: (provider: unknown) => new EmailService(provider as never),
      inject: [EMAIL_PROVIDER],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
