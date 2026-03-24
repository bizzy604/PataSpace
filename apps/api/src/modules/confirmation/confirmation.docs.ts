import { ApiProperty } from '@nestjs/swagger';
import { CommissionStatus, ConfirmationSide } from '@prisma/client';

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
  @ApiProperty({ example: 750 })
  amount!: number;

  @ApiProperty({ enum: CommissionStatus, example: CommissionStatus.PENDING })
  status!: CommissionStatus;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  payableOn!: string;
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

  @ApiProperty({ example: 'Waiting for outgoing tenant to confirm.' })
  message!: string;
}
