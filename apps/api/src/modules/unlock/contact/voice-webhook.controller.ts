/**
 * Purpose: Voice-provider callback for the masked contact layer (spec v1.2
 * section 4.5): bridges a caller on a pooled virtual number to the other
 * party of the unlock, or plays a closed prompt for stale mappings.
 * Why important: raw numbers are never exchanged; every call flows through
 * this mapping. A stale session must NEVER bridge (spec section 13).
 * Used by: Africa's Talking Voice callbacks (POST /webhooks/voice).
 */
import { Body, Controller, Header, Post, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator';
import { VoiceBridgeService } from './voice-bridge.service';

type VoiceEventPayload = {
  callerNumber?: string;
  destinationNumber?: string;
  isActive?: string;
  token?: string;
};

@ApiExcludeController()
@Controller('webhooks/voice')
export class VoiceWebhookController {
  private readonly webhookToken: string | undefined;

  constructor(
    private readonly voiceBridgeService: VoiceBridgeService,
    configService: ConfigService,
  ) {
    this.webhookToken = configService.get<string>('contact.webhookToken');
  }

  @Public()
  @Post()
  @Header('Content-Type', 'application/xml')
  async handleVoiceEvent(@Body() payload: VoiceEventPayload): Promise<string> {
    if (this.webhookToken && payload.token !== this.webhookToken) {
      throw new UnauthorizedException({
        code: 'INVALID_WEBHOOK_TOKEN',
        message: 'Voice webhook token mismatch',
      });
    }

    return this.voiceBridgeService.buildCallResponse(
      payload.callerNumber ?? '',
      payload.destinationNumber ?? '',
    );
  }
}
