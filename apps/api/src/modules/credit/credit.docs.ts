import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '@prisma/client';

export class CreditBalanceResponseDto {
  @ApiProperty({ example: 5000 })
  balance!: number;

  @ApiProperty({ example: 12000 })
  lifetimeEarned!: number;

  @ApiProperty({ example: 7000 })
  lifetimeSpent!: number;

  @ApiProperty({ example: 1500 })
  pendingCommissions!: number;
}

export class CreditTransactionResponseDto {
  @ApiProperty({ example: 'cm8tx123' })
  id!: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.PURCHASE })
  type!: TransactionType;

  @ApiProperty({ example: 5000 })
  amount!: number;

  @ApiProperty({ example: 2000 })
  balanceBefore!: number;

  @ApiProperty({ example: 7000 })
  balanceAfter!: number;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.COMPLETED })
  status!: TransactionStatus;

  @ApiPropertyOptional({ example: 'Credit purchase - 5 credits package' })
  description?: string;

  @ApiPropertyOptional({ example: 'NLJ7RT61SV' })
  mpesaReceiptNumber?: string;

  @ApiPropertyOptional({ example: 'cm8unlock123' })
  unlockId?: string;

  @ApiProperty({ example: '2026-03-20T12:00:00.000Z' })
  createdAt!: string;
}

export class CreditTransactionPaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 1 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrev!: boolean;
}

export class CreditTransactionsResponseDto {
  @ApiProperty({ type: () => [CreditTransactionResponseDto] })
  data!: CreditTransactionResponseDto[];

  @ApiProperty({ type: () => CreditTransactionPaginationDto })
  pagination!: CreditTransactionPaginationDto;
}
