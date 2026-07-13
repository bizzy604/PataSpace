/**
 * Purpose: Swagger models for the admin support workspace endpoints — queue
 *   summaries, ticket detail with thread, and message records.
 * Why important: Documents the triage payloads the console renders alongside
 *   the Zod schemas that validate them.
 * Used by: AdminSupportController (modules/admin).
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  Role,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@pataspace/contracts';
import { AdminPaginationMetaDto } from './admin-users.docs';

class SupportReporterDto {
  @ApiProperty({ example: 'cm8user123' })
  id!: string;

  @ApiProperty({ example: 'Sarah' })
  firstName!: string;

  @ApiProperty({ example: 'Kamau' })
  lastName!: string;
}

export class SupportTicketMessageRecordDto {
  @ApiProperty({ example: 'cm8msg123' })
  id!: string;

  @ApiProperty({ example: 'cm8user123' })
  authorId!: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  authorRole!: Role;

  @ApiProperty({ example: 'Sarah Kamau' })
  authorName!: string;

  @ApiProperty({ example: 'Looking into the listing and the landlord activity now.' })
  body!: string;

  @ApiProperty({ example: '2026-07-13T10:28:00.000Z' })
  createdAt!: string;
}

export class AdminSupportTicketSummaryDto {
  @ApiProperty({ example: 'cm8ticket123' })
  id!: string;

  @ApiProperty({ example: 'Landlord rejected application' })
  subject!: string;

  @ApiProperty({ enum: SupportTicketStatus, example: SupportTicketStatus.OPEN })
  status!: SupportTicketStatus;

  @ApiProperty({ enum: SupportTicketPriority, example: SupportTicketPriority.HIGH })
  priority!: SupportTicketPriority;

  @ApiProperty({ type: () => SupportReporterDto })
  reporter!: SupportReporterDto;

  @ApiProperty({ example: null, nullable: true })
  assignedToId!: string | null;

  @ApiProperty({ example: 3 })
  messageCount!: number;

  @ApiProperty({ example: '2026-07-13T10:28:00.000Z', nullable: true })
  lastMessageAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  relatedUnlockId!: string | null;

  @ApiProperty({ example: '2026-07-13T10:23:00.000Z' })
  createdAt!: string;
}

export class AdminSupportTicketsResponseDto {
  @ApiProperty({ type: [AdminSupportTicketSummaryDto] })
  data!: AdminSupportTicketSummaryDto[];

  @ApiProperty({ type: () => AdminPaginationMetaDto })
  meta!: AdminPaginationMetaDto;
}

class SupportDetailReporterDto extends SupportReporterDto {
  @ApiProperty({ example: '+254712345678', nullable: true })
  phoneNumber!: string | null;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  createdAt!: string;
}

export class AdminSupportTicketDetailDto {
  @ApiProperty({ example: 'cm8ticket123' })
  id!: string;

  @ApiProperty({ example: 'Landlord rejected application' })
  subject!: string;

  @ApiProperty({ enum: SupportTicketStatus, example: SupportTicketStatus.OPEN })
  status!: SupportTicketStatus;

  @ApiProperty({ enum: SupportTicketPriority, example: SupportTicketPriority.HIGH })
  priority!: SupportTicketPriority;

  @ApiProperty({ example: null, nullable: true })
  assignedToId!: string | null;

  @ApiProperty({ example: null, nullable: true })
  channel!: string | null;

  @ApiProperty({ example: null, nullable: true })
  adminNotes!: string | null;

  @ApiProperty({ example: null, nullable: true })
  relatedUnlockId!: string | null;

  @ApiProperty({ type: () => SupportDetailReporterDto })
  reporter!: SupportDetailReporterDto;

  @ApiProperty({ type: [SupportTicketMessageRecordDto] })
  messages!: SupportTicketMessageRecordDto[];

  @ApiProperty({ example: null, nullable: true })
  resolvedAt!: string | null;

  @ApiProperty({ example: '2026-07-13T10:23:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-13T10:28:00.000Z' })
  updatedAt!: string;
}
