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

  @ApiOperation({ summary: 'Create a pending M-Pesa credit purchase and trigger STK push' })
  @ApiBody({ type: PurchaseCreditsRequestDto })
  @ApiAcceptedResponse({
    type: PurchaseCreditsResponseDto,
    description: 'Purchase request accepted and awaiting callback.',
  })
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
  ) {}

  @Public()
  @ApiOperation({ summary: 'Receive M-Pesa STK callback events' })
  @ApiHeader({
    name: 'x-mpesa-callback-secret',
    required: false,
    description:
      'Optional shared secret for authenticating callbacks. Required when MPESA_CALLBACK_SECRET is configured.',
  })
  @ApiBody({ type: MpesaCallbackRequestDto })
  @ApiOkResponse({
    type: MpesaCallbackAckResponseDto,
    description: 'Callback accepted for processing.',
  })
  @HttpCode(200)
  @Post('mpesa-callback')
  handleMpesaCallback(
    @Headers('x-mpesa-callback-secret') callbackSecretHeader: string | undefined,
    @Query('token') callbackSecretQuery: string | undefined,
    @Body(new ZodValidationPipe(mpesaCallbackSchema)) input: MpesaCallbackRequest,
  ): Promise<MpesaCallbackAckResponse> {
    this.assertCallbackAuthorized(callbackSecretHeader ?? callbackSecretQuery);

    return this.paymentService.handleMpesaCallback(input);
  }

  private assertCallbackAuthorized(providedSecret: string | undefined) {
    const expectedSecret =
      this.configService.get<string>('infrastructure.mpesa.callbackSecret') ?? '';

    if (!expectedSecret) {
      return;
    }

    if (!providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
      throw new UnauthorizedException({
        code: 'INVALID_CALLBACK_SIGNATURE',
        message: 'Payment callback authentication failed',
      });
    }
  }
}

function secretsMatch(providedSecret: string, expectedSecret: string) {
  const providedBuffer = Buffer.from(providedSecret, 'utf8');
  const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
