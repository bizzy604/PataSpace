/**
 * Purpose: Swagger/OpenAPI DTO classes for the payment and credit purchase endpoints.
 * Why important: Keeps API documentation types separate from runtime contracts.
 * Used by: payment.controller.ts
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';

export class PurchaseCreditsRequestDto {
  @ApiProperty({ enum: ['500_credits', '1000_credits', '2500_credits', '5000_credits', '10000_credits', '20000_credits'], example: '5000_credits' })
  package!: '500_credits' | '1000_credits' | '2500_credits' | '5000_credits' | '10000_credits' | '20000_credits';

  @ApiProperty({ enum: ['mpesa', 'stellar'], example: 'mpesa', description: 'Payment method. Use mpesa for M-Pesa STK push; use stellar to receive a Stellar payment address.' })
  paymentMethod!: 'mpesa' | 'stellar';

  @ApiPropertyOptional({ example: '+254712345678', description: 'Required when paymentMethod is mpesa.' })
  phoneNumber?: string;
}

export class PurchaseCreditsResponseDto {
  @ApiProperty({ example: 'cm8tx123' })
  transactionId!: string;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @ApiProperty({ example: 500 })
  amount!: number;

  @ApiProperty({ example: 5 })
  credits!: number;

  @ApiProperty({ example: 'M-Pesa prompt sent to +254712345678. Enter your PIN.' })
  message!: string;

  @ApiProperty({ enum: ['mpesa', 'stellar'], example: 'mpesa' })
  paymentMethod!: string;

  @ApiPropertyOptional({ example: '30 seconds' })
  estimatedCompletion?: string;

  @ApiPropertyOptional({ example: 'GABC...XYZ', description: 'Treasury address to send XLM to (Stellar only).' })
  stellarDestinationAddress?: string;

  @ApiPropertyOptional({ example: 'cm8tx123', description: 'Memo to include with your Stellar payment (Stellar only).' })
  stellarMemo?: string;

  @ApiPropertyOptional({ example: '29.4117647', description: 'Amount in XLM to send (Stellar only).' })
  stellarAmountXLM?: string;
}

export class MpesaCallbackMetadataItemDto {
  @ApiProperty({ example: 'Amount' })
  Name!: string;

  @ApiPropertyOptional({ example: 500 })
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
