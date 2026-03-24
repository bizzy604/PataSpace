import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';

export class PurchaseCreditsRequestDto {
  @ApiProperty({ enum: ['5_credits', '10_credits', '20_credits'], example: '5_credits' })
  package!: '5_credits' | '10_credits' | '20_credits';

  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;
}

export class PurchaseCreditsResponseDto {
  @ApiProperty({ example: 'cm8tx123' })
  transactionId!: string;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @ApiProperty({ example: 5000 })
  amount!: number;

  @ApiProperty({ example: 5000 })
  credits!: number;

  @ApiProperty({ example: 'M-Pesa prompt sent to +254712345678. Enter your PIN.' })
  message!: string;

  @ApiPropertyOptional({ example: '30 seconds' })
  estimatedCompletion?: string;
}

export class MpesaCallbackMetadataItemDto {
  @ApiProperty({ example: 'Amount' })
  Name!: string;

  @ApiPropertyOptional({ example: 5000 })
  Value?: string | number;
}

export class MpesaCallbackMetadataDto {
  @ApiProperty({ type: () => [MpesaCallbackMetadataItemDto] })
  Item!: MpesaCallbackMetadataItemDto[];
}

export class MpesaCallbackPayloadDto {
  @ApiProperty({ example: '29115-34620561-1' })
  MerchantRequestID!: string;

  @ApiProperty({ example: 'ws_CO_191220221830000001' })
  CheckoutRequestID!: string;

  @ApiProperty({ example: 0 })
  ResultCode!: number;

  @ApiProperty({ example: 'The service request is processed successfully.' })
  ResultDesc!: string;

  @ApiPropertyOptional({ type: () => MpesaCallbackMetadataDto })
  CallbackMetadata?: MpesaCallbackMetadataDto;
}

export class MpesaCallbackBodyDto {
  @ApiProperty({ type: () => MpesaCallbackPayloadDto })
  stkCallback!: MpesaCallbackPayloadDto;
}

export class MpesaCallbackRequestDto {
  @ApiProperty({ type: () => MpesaCallbackBodyDto })
  Body!: MpesaCallbackBodyDto;
}

export class MpesaCallbackAckResponseDto {
  @ApiProperty({ example: 0 })
  ResultCode!: 0;

  @ApiProperty({ example: 'Accepted' })
  ResultDesc!: 'Accepted';
}
