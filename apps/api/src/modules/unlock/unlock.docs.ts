import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ type: () => UnlockTenantDto })
  tenant!: UnlockTenantDto;

  @ApiProperty({ example: 'Contact unlocked. SMS sent to tenant to notify them.' })
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

export class MyUnlockRecordDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ type: () => MyUnlockListingDto })
  listing!: MyUnlockListingDto;

  @ApiProperty({ example: 2500 })
  creditsSpent!: number;

  @ApiProperty({ type: () => UnlockContactInfoDto })
  contactInfo!: UnlockContactInfoDto;

  @ApiProperty({ enum: ['pending_confirmation', 'confirmed', 'refunded'] })
  status!: 'pending_confirmation' | 'confirmed' | 'refunded';

  @ApiProperty({ example: null, nullable: true })
  myConfirmation!: string | null;

  @ApiProperty({ example: null, nullable: true })
  tenantConfirmation!: string | null;

  @ApiProperty({ example: '2026-03-20T14:00:00.000Z' })
  createdAt!: string;
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
