/**
 * Purpose: Safe sandbox email provider for development and tests.
 * Why important: Local development must not fail because mail credentials are
 *   absent, while still preserving the provider contract.
 * Used by: EmailModule in non-production environments.
 */
import { Injectable } from '@nestjs/common';
import { EmailProvider, SendMailPayload } from '../email.service';

@Injectable()
export class SandboxEmailProvider implements EmailProvider {
  async send(payload: SendMailPayload): Promise<void> {
    // Intentionally no-op in sandbox mode; useful for local development and tests.
    void payload;
  }
}
