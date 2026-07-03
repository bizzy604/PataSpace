import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnlockDeadReason } from '@pataspace/contracts';

export class UnlockContactInfoDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: '123 Argwings Kodhek Road, Apt 5B' })
  address!: string;

  @ApiProperty({ example: -1.289563 })
  latitude!: number;

  @ApiProperty({ example: 36.790942 })
  longitude!: number;
}

export class UnlockTenantDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;
}

export class CreateUnlockRequestDto {
  @ApiProperty({ example: 'cm8listing123' })
  listingId!: string;
}

export class CreateUnlockResponseDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ example: 2500 })
  creditsSpent!: number;

  @ApiProperty({ example: 2500 })
  newBalance!: number;

  @ApiProperty({ type: () => UnlockContactInfoDto })
  contactInfo!: UnlockContactInfoDto;

  @ApiProperty({
    enum: ['direct', 'masked'],
    example: 'masked',
    description:
      'masked: phoneNumber is a pooled virtual number bridged by PataSpace; ' +
      'direct: legacy raw-number reveal (pre-provisioning fallback).',
  })
  contactMode!: 'direct' | 'masked';

  @ApiProperty({ example: '2026-03-23T14:00:00.000Z', nullable: true })
  contactExpiresAt!: string | null;

  @ApiProperty({ type: () => UnlockTenantDto })
  tenant!: UnlockTenantDto;

  @ApiProperty({ example: 'Contact unlocked. SMS sent to tenant to notify them.' })
  message!: string;
}

export class ReportUnlockDeadRequestDto {
  @ApiProperty({ enum: UnlockDeadReason, example: UnlockDeadReason.OCCUPIED })
  reason!: UnlockDeadReason;

  @ApiPropertyOptional({ example: 'Caretaker said the unit was taken last week.' })
  comment?: string;
}

export class ReportUnlockDeadResponseDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ enum: UnlockDeadReason, example: UnlockDeadReason.OCCUPIED })
  reason!: UnlockDeadReason;

  @ApiProperty({ example: 300 })
  creditsRefunded!: number;

  @ApiProperty({ example: 2800 })
  newBalance!: number;

  @ApiProperty({ example: 'Credits refunded instantly. Thanks for keeping listings honest.' })
  message!: string;
}

export class MyUnlockListingDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;

  @ApiProperty({ example: 25000 })
  monthlyRent!: number;

  @ApiProperty({ example: 2 })
  bedrooms!: number;
}

export class MyUnlockDisputeSummaryDto {
  @ApiProperty({ example: 'cm8dispute123' })
  id!: string;

  @ApiProperty({ enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] })
  status!: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
}

export class MyUnlockRecordDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ type: () => MyUnlockListingDto })
  listing!: MyUnlockListingDto;

  @ApiProperty({ example: 2500 })
  creditsSpent!: number;

  @ApiProperty({ type: () => UnlockContactInfoDto })
  contactInfo!: UnlockContactInfoDto;

  @ApiProperty({ enum: ['pending_confirmation', 'confirmed', 'disputed', 'refunded'] })
  status!: 'pending_confirmation' | 'confirmed' | 'disputed' | 'refunded';

  @ApiProperty({ example: null, nullable: true })
  myConfirmation!: string | null;

  @ApiProperty({ example: null, nullable: true })
  tenantConfirmation!: string | null;

  @ApiProperty({ example: '2026-03-20T14:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: () => MyUnlockDisputeSummaryDto, nullable: true })
  dispute!: MyUnlockDisputeSummaryDto | null;
}

export class UnlockPaginationDto {
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

export class MyUnlocksResponseDto {
  @ApiProperty({ type: () => [MyUnlockRecordDto] })
  data!: MyUnlockRecordDto[];

  @ApiProperty({ type: () => UnlockPaginationDto })
  pagination!: UnlockPaginationDto;
}

export class ReceivedUnlockCommissionDto {
  @ApiProperty({ example: 750 })
  amountKES!: number;

  @ApiProperty({ enum: ['PENDING', 'DUE', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'] })
  status!: string;

  @ApiProperty({ example: '2026-03-27T14:00:00.000Z', nullable: true })
  payableOn!: string | null;
}

export class ReceivedUnlockRecordDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ type: () => MyUnlockListingDto })
  listing!: MyUnlockListingDto;

  @ApiProperty({ example: false })
  incomingConfirmed!: boolean;

  @ApiProperty({ example: false })
  outgoingConfirmed!: boolean;

  @ApiProperty({ enum: ['pending_confirmation', 'confirmed', 'disputed', 'refunded'] })
  status!: 'pending_confirmation' | 'confirmed' | 'disputed' | 'refunded';

  @ApiProperty({ type: () => ReceivedUnlockCommissionDto, nullable: true })
  commission!: ReceivedUnlockCommissionDto | null;

  @ApiProperty({ example: false })
  isRefunded!: boolean;

  @ApiProperty({ example: '2026-03-20T14:00:00.000Z' })
  createdAt!: string;
}

export class ReceivedUnlocksResponseDto {
  @ApiProperty({ type: () => [ReceivedUnlockRecordDto] })
  data!: ReceivedUnlockRecordDto[];

  @ApiProperty({ type: () => UnlockPaginationDto })
  pagination!: UnlockPaginationDto;
}
