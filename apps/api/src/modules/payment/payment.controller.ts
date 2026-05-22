/**
 * Purpose: HTTP transport layer for credit purchases and M-Pesa webhook callbacks.
 * Why important: Routes requests to PaymentService; handles auth and webhook signature verification.
 * Used by: NestJS router (AppModule → PaymentModule)
 */

import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  MpesaB2CResultRequest,
  mpesaB2CResultSchema,
  MpesaCallbackAckResponse,
  mpesaCallbackSchema,
  MpesaCallbackRequest,
  PurchaseCreditsRequest,
  purchaseCreditsSchema,
  PurchaseCreditsResponse,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import { CommissionCallbackService } from '../commission-callback/commission-callback.service';
import {
  MpesaCallbackAckResponseDto,
  MpesaCallbackRequestDto,
  PurchaseCreditsRequestDto,
  PurchaseCreditsResponseDto,
} from './payment.docs';
import { PaymentService } from './payment.service';

@ApiTags('Credits')
@ApiBearerAuth('bearer')
@Controller('credits')
export class CreditPurchaseController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({
    summary: 'Initiate a credit purchase via M-Pesa STK push or Stellar payment request',
    description: 'For mpesa: triggers STK push to the provided phone number. For stellar: returns a treasury address and memo — the client sends XLM from their own wallet.',
  })
  @ApiBody({ type: PurchaseCreditsRequestDto })
  @ApiAcceptedResponse({ type: PurchaseCreditsResponseDto, description: 'Purchase request accepted.' })
  @ApiRateLimit('creditPurchase')
  @HttpCode(202)
  @Post('purchase')
  createPurchase(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(purchaseCreditsSchema)) input: PurchaseCreditsRequest,
  ): Promise<PurchaseCreditsResponse> {
    return this.paymentService.createPurchase(userId, input);
  }
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly commissionCallbackService: CommissionCallbackService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Receive M-Pesa STK callback events from Safaricom Daraja' })
  @ApiHeader({
    name: 'x-mpesa-callback-secret',
    required: false,
    description: 'Shared secret to authenticate Safaricom callbacks when MPESA_CALLBACK_SECRET is set.',
  })
  @ApiBody({ type: MpesaCallbackRequestDto })
  @ApiOkResponse({ type: MpesaCallbackAckResponseDto, description: 'Callback accepted.' })
  @HttpCode(200)
  @Post('mpesa-callback')
  handleMpesaCallback(
    @Headers('x-mpesa-callback-secret') headerSecret: string | undefined,
    @Query('token') querySecret: string | undefined,
    @Body(new ZodValidationPipe(mpesaCallbackSchema)) input: MpesaCallbackRequest,
  ): Promise<MpesaCallbackAckResponse> {
    this.assertCallbackAuthorized(headerSecret ?? querySecret);
    return this.paymentService.handleMpesaCallback(input);
  }

  @Public()
  @ApiOperation({
    summary: 'Receive M-Pesa B2C result callbacks for commission payouts',
    description:
      'Safaricom POSTs the final settlement state here. Transitions the matching Commission row to PAID (ResultCode=0) or FAILED, idempotently — already-settled commissions are accepted but skipped.',
  })
  @ApiHeader({
    name: 'x-mpesa-callback-secret',
    required: false,
    description:
      'Shared secret to authenticate Safaricom callbacks when MPESA_CALLBACK_SECRET is set.',
  })
  @ApiOkResponse({ type: MpesaCallbackAckResponseDto, description: 'B2C callback accepted.' })
  @HttpCode(200)
  @Post('mpesa-b2c-callback')
  async handleMpesaB2CCallback(
    @Headers('x-mpesa-callback-secret') headerSecret: string | undefined,
    @Query('token') querySecret: string | undefined,
    @Body(new ZodValidationPipe(mpesaB2CResultSchema)) input: MpesaB2CResultRequest,
  ): Promise<MpesaCallbackAckResponse> {
    this.assertCallbackAuthorized(headerSecret ?? querySecret);
    await this.commissionCallbackService.handleB2CResult(input);
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  private assertCallbackAuthorized(provided: string | undefined) {
    const expected = this.configService.get<string>('infrastructure.mpesa.callbackSecret') ?? '';
    if (!expected) return;
    if (!provided || !secretsMatch(provided, expected)) {
      throw new UnauthorizedException({ code: 'INVALID_CALLBACK_SIGNATURE', message: 'Payment callback authentication failed' });
    }
  }
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
