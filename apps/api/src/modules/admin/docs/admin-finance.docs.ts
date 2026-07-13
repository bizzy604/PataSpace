/**
 * Purpose: Swagger models for the admin finance endpoints — summary tiles,
 *   payout ledger rows, and the retry action result.
 * Why important: Documents the money payloads the console renders so the API
 *   contract is legible in Swagger alongside the Zod schemas.
 * Used by: AdminFinanceController (modules/admin).
 */
import { ApiProperty } from '@nestjs/swagger';
import { CommissionStatus } from '@pataspace/contracts';
import { AdminPaginationMetaDto } from './admin-users.docs';

class MoneyBucketDto {
  @ApiProperty({ example: 452000 })
  amountKES!: number;

  @ApiProperty({ example: 124 })
  count!: number;
}

class PendingPayoutsDto extends MoneyBucketDto {
  @ApiProperty({ example: 124 })
  partners!: number;
}

export class AdminFinanceSummaryResponseDto {
  @ApiProperty({ type: () => PendingPayoutsDto })
  pendingPayouts!: PendingPayoutsDto;

  @ApiProperty({ type: () => MoneyBucketDto })
  failedPayouts!: MoneyBucketDto;

  @ApiProperty({ type: () => MoneyBucketDto })
  paidThisMonth!: MoneyBucketDto;

  @ApiProperty({ type: () => MoneyBucketDto })
  paidYearToDate!: MoneyBucketDto;

  @ApiProperty({ example: '2026-07-13T09:00:00.000Z' })
  generatedAt!: string;
}

class AdminPayoutPayeeDto {
  @ApiProperty({ example: 'cm8user123' })
  id!: string;

  @ApiProperty({ example: 'Grace' })
  firstName!: string;

  @ApiProperty({ example: 'Wanjiru' })
  lastName!: string;
}

class AdminPayoutListingDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ example: 'Nairobi' })
  county!: string;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;
}

export class AdminPayoutRecordDto {
  @ApiProperty({ example: 'cm8commission123' })
  id!: string;

  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ enum: CommissionStatus, example: CommissionStatus.FAILED })
  status!: CommissionStatus;

  @ApiProperty({ example: 12500 })
  amountKES!: number;

  @ApiProperty({ example: 'QWE892NSD', nullable: true })
  mpesaReceiptNumber!: string | null;

  @ApiProperty({ example: 3 })
  paymentAttempts!: number;

  @ApiProperty({ example: 'Invalid MSISDN', nullable: true })
  lastAttemptError!: string | null;

  @ApiProperty({ type: () => AdminPayoutPayeeDto })
  payee!: AdminPayoutPayeeDto;

  @ApiProperty({ type: () => AdminPayoutListingDto })
  listing!: AdminPayoutListingDto;

  @ApiProperty({ example: '2026-07-06T09:00:00.000Z' })
  eligibleAt!: string;

  @ApiProperty({ example: null, nullable: true })
  paidAt!: string | null;

  @ApiProperty({ example: '2026-07-01T09:00:00.000Z' })
  createdAt!: string;
}

export class AdminPayoutLedgerResponseDto {
  @ApiProperty({ type: [AdminPayoutRecordDto] })
  data!: AdminPayoutRecordDto[];

  @ApiProperty({ type: () => AdminPaginationMetaDto })
  meta!: AdminPaginationMetaDto;
}

export class AdminRetryPayoutResponseDto {
  @ApiProperty({ example: 'cm8commission123' })
  commissionId!: string;

  @ApiProperty({
    example: 'submitted',
    enum: ['paid', 'submitted', 'retry', 'dead-letter', 'skipped', 'requeued'],
  })
  outcome!: string;

  @ApiProperty({ enum: CommissionStatus, example: CommissionStatus.PROCESSING })
  status!: CommissionStatus;
}
