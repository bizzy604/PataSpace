/**
 * Purpose: Resend-backed email provider implementation.
 * Why important: Real transactional mail needs a concrete provider integration
 *   instead of a placeholder or a direct dependency in the use case.
 * Used by: EmailModule and any future transactional email flows.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailProvider, SendMailPayload } from '../email.service';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = configService.get<string>('infrastructure.email.resend.apiKey') ?? '';
    this.client = new Resend(apiKey);
    this.fromAddress =
      configService.get<string>('infrastructure.email.resend.from') ??
      'PataSpace <no-reply@send.dalakenya.com>';
  }

  async send(payload: SendMailPayload): Promise<void> {
    if (!this.client || !this.fromAddress) {
      return;
    }

    const { error } = await this.client.emails.send({
      from: payload.from ?? this.fromAddress,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html ?? '<p>Sent from PataSpace.</p>',
      text: payload.text ?? 'Sent from PataSpace.',
    });

    if (error) {
      throw new Error(`Resend email delivery failed: ${error.message}`);
    }
  }
}
