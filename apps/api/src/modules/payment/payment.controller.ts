import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiBody,
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
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @ApiOperation({ summary: 'Receive M-Pesa STK callback events' })
  @ApiBody({ type: MpesaCallbackRequestDto })
  @ApiOkResponse({
    type: MpesaCallbackAckResponseDto,
    description: 'Callback accepted for processing.',
  })
  @HttpCode(200)
  @Post('mpesa-callback')
  handleMpesaCallback(
    @Body(new ZodValidationPipe(mpesaCallbackSchema)) input: MpesaCallbackRequest,
  ): Promise<MpesaCallbackAckResponse> {
    return this.paymentService.handleMpesaCallback(input);
  }
}
