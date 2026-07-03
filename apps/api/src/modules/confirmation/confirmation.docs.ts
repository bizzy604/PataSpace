/**
 * Purpose: Swagger models for the confirmation loop and success-fee
 * settlement endpoints.
 * Why important: keeps the documented API in lockstep with the contracts.
 * Used by: ConfirmationController.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionStatus, ConfirmationSide, SuccessFeeStatus } from '@prisma/client';

export class CreateConfirmationRequestDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({
    enum: ConfirmationSide,
    example: ConfirmationSide.INCOMING_TENANT,
  })
  side!: ConfirmationSide;
}

export class ConfirmationCommissionDto {
  @ApiProperty({ example: 1750 })
  amount!: number;

  @ApiProperty({ enum: CommissionStatus, example: CommissionStatus.PENDING })
  status!: CommissionStatus;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  payableOn!: string;
}

export class ConfirmationSuccessFeeDto {
  @ApiProperty({ example: 2500 })
  feeDueKes!: number;

  @ApiProperty({ example: 300, description: 'Unlock credits captured toward the fee.' })
  creditsApplied!: number;

  @ApiProperty({ example: 0 })
  cashCollectedKes!: number;

  @ApiProperty({ example: 2200 })
  remainingKes!: number;

  @ApiProperty({ enum: SuccessFeeStatus, example: SuccessFeeStatus.PARTIAL })
  status!: SuccessFeeStatus;
}

export class VacatedListingPromptDto {
  @ApiProperty({ example: 'cm8confirmation123' })
  seededFromConfirmationId!: string;

  @ApiProperty({ example: 1750 })
  estimatedEarningsKes!: number;

  @ApiProperty({
    example: "Leaving a house behind? It's worth ~KES 1750 on PataSpace. Post it in 2 minutes.",
  })
  message!: string;
}

export class CreateConfirmationResponseDto {
  @ApiProperty({ example: 'cm8confirmation123' })
  confirmationId!: string;

  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({
    enum: ConfirmationSide,
    example: ConfirmationSide.INCOMING_TENANT,
  })
  side!: ConfirmationSide;

  @ApiProperty({ example: '2026-03-25T10:00:00.000Z' })
  confirmedAt!: string;

  @ApiProperty({ example: false })
  bothConfirmed!: boolean;

  @ApiProperty({
    type: () => ConfirmationCommissionDto,
    required: false,
  })
  commission?: ConfirmationCommissionDto;

  @ApiPropertyOptional({ type: () => ConfirmationSuccessFeeDto })
  successFee?: ConfirmationSuccessFeeDto;

  @ApiPropertyOptional({ type: () => VacatedListingPromptDto })
  vacatedListingPrompt?: VacatedListingPromptDto;

  @ApiProperty({ example: 'Waiting for outgoing tenant to confirm.' })
  message!: string;
}

export class SettleSuccessFeeRequestDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;
}

export class SettleSuccessFeeResponseDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ example: 2500 })
  feeDueKes!: number;

  @ApiProperty({ example: 300 })
  creditsApplied!: number;

  @ApiProperty({ example: 2200 })
  cashCollectedKes!: number;

  @ApiProperty({ example: 0 })
  remainingKes!: number;

  @ApiProperty({ enum: SuccessFeeStatus, example: SuccessFeeStatus.SETTLED })
  status!: SuccessFeeStatus;

  @ApiProperty({ example: 500 })
  newBalance!: number;

  @ApiProperty({ example: 'Fee settled. Keys time!' })
  message!: string;
}
