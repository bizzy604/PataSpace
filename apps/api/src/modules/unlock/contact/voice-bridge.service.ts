/**
 * Purpose: Resolves an inbound proxy call (caller + virtual number) to a
 * bridge instruction: dial the unlock's other party, or play a closed prompt.
 * Why important: this is the only place caller identity meets the session
 * mapping; expired or unknown sessions must never bridge (spec section 13).
 * Used by: VoiceWebhookController.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decryptField } from '../../../common/security/encryption.util';
import { ProxySessionService } from './proxy-session.service';

const CLOSED_PROMPT =
  '<Response><Say>This PataSpace listing is closed. Please unlock a listing in the app to reach the poster.</Say></Response>';

@Injectable()
export class VoiceBridgeService {
  private readonly encryptionKey: string;

  constructor(
    private readonly proxySessionService: ProxySessionService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
  }

  async buildCallResponse(callerNumber: string, destinationNumber: string): Promise<string> {
    const session = await this.proxySessionService.findRoutableSession(destinationNumber);

    if (!session || !callerNumber) {
      return CLOSED_PROMPT;
    }

    const buyerPhone = this.safeDecrypt(session.unlock.buyer.phoneNumberEncrypted);
    const posterPhone = this.safeDecrypt(session.unlock.listing.user.phoneNumberEncrypted);
    const normalizedCaller = callerNumber.trim();

    if (posterPhone && normalizedCaller === posterPhone && buyerPhone) {
      await this.proxySessionService.recordInboundCall(session.id, true);
      return this.bridgeTo(buyerPhone);
    }

    if (buyerPhone && normalizedCaller === buyerPhone && posterPhone) {
      await this.proxySessionService.recordInboundCall(session.id, false);
      return this.bridgeTo(posterPhone);
    }

    return CLOSED_PROMPT;
  }

  private bridgeTo(phoneNumber: string): string {
    return `<Response><Dial phoneNumbers="${phoneNumber}"/></Response>`;
  }

  private safeDecrypt(value: string | null): string | null {
    if (!value) {
      return null;
    }
    try {
      return decryptField(value, this.encryptionKey);
    } catch {
      return null;
    }
  }
}
