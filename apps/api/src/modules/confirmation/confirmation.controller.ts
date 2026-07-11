/**
 * Purpose: HTTP transport for the confirmation loop: per-side move-in
 * confirmations and success-fee settlement (spec sections 4.3/4.4).
 * Why important: routes only; settlement rules live in the services.
 * Used by: mobile app confirmation and fee-settlement flows.
 */
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  createConfirmationSchema,
  CreateConfirmationRequest,
  CreateConfirmationResponse,
  settleSuccessFeeSchema,
  SettleSuccessFeeRequest,
  SettleSuccessFeeResponse,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateConfirmationRequestDto,
  CreateConfirmationResponseDto,
  SettleSuccessFeeRequestDto,
  SettleSuccessFeeResponseDto,
} from './confirmation.docs';
import { ConfirmationService } from './confirmation.service';
import { SuccessFeeSettlementService } from './success-fee-settlement.service';

@ApiTags('Confirmations')
@ApiBearerAuth('bearer')
@Controller('confirmations')
export class ConfirmationController {
  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly successFeeSettlementService: SuccessFeeSettlementService,
  ) {}

  @ApiOperation({ summary: 'Confirm a connection for an unlocked listing' })
  @ApiBody({ type: CreateConfirmationRequestDto })
  @ApiCreatedResponse({
    type: CreateConfirmationResponseDto,
    description: 'Confirmation recorded successfully.',
  })
  @HttpCode(201)
  @Post()
  createConfirmation(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createConfirmationSchema)) input: CreateConfirmationRequest,
  ): Promise<CreateConfirmationResponse> {
    return this.confirmationService.createConfirmation(userId, input);
  }

  @ApiOperation({
    summary: 'Settle the remaining success-fee balance from credits',
    description:
      'Applies the mover wallet credits to the remaining move-in fee. Top up ' +
      'the exact shortfall via the credit purchase flow first if needed.',
  })
  @ApiBody({ type: SettleSuccessFeeRequestDto })
  @ApiOkResponse({
    type: SettleSuccessFeeResponseDto,
    description: 'Success fee settled (or already settled).',
  })
  @HttpCode(200)
  @Post('settle-fee')
  async settleFee(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(settleSuccessFeeSchema)) input: SettleSuccessFeeRequest,
  ): Promise<SettleSuccessFeeResponse> {
    const result = await this.successFeeSettlementService.settleFromCredits(userId, input.unlockId);

    return {
      unlockId: input.unlockId,
      feeDueKes: result.fee.feeDueKes,
      creditsApplied: result.fee.creditsApplied,
      cashCollectedKes: result.fee.cashCollectedKes,
      remainingKes: result.fee.remainingKes,
      status: result.fee.status,
      newBalance: result.newBalance,
      message: result.alreadySettled
        ? 'Fee already settled.'
        : 'Fee settled. Keys time!',
    };
  }
}
