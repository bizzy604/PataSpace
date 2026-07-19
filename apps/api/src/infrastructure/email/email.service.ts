/**
 * Purpose: Thin email delivery wrapper around an injected provider.
 * Why important: Cross-cutting mail delivery needs a stable contract and a
 *   single place for fallback handling and logging.
 * Used by: auth flows and any future transactional notifications.
 */
import { Injectable } from '@nestjs/common';

export type SendMailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

export interface EmailProvider {
  send(payload: SendMailPayload): Promise<void>;
}

@Injectable()
export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  async sendMail(payload: SendMailPayload): Promise<void> {
    await this.provider.send(payload);
  }
}
