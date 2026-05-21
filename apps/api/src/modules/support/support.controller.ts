/**
 * Purpose: HTTP transport for the support feature — exposes POST/GET on /support/tickets.
 * Why important: Controllers stay thin; this one validates inputs with the Zod
 *   pipe and delegates all logic to SupportService.
 * Used by: app.module.ts via SupportModule.
 */
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  createSupportTicketSchema,
  CreateSupportTicketRequest,
  CreateSupportTicketResponse,
  PaginatedSupportTicketsResponse,
  supportTicketsQuerySchema,
  SupportTicketRecord,
  SupportTicketsFilters,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateSupportTicketRequestDto,
  PaginatedSupportTicketsResponseDto,
  SupportTicketRecordDto,
} from './support.docs';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth('bearer')
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @ApiOperation({ summary: 'File a new support ticket' })
  @ApiBody({ type: CreateSupportTicketRequestDto })
  @ApiCreatedResponse({
    type: SupportTicketRecordDto,
    description: 'Support ticket created.',
  })
  @HttpCode(201)
  @Post()
  createTicket(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createSupportTicketSchema)) input: CreateSupportTicketRequest,
  ): Promise<CreateSupportTicketResponse> {
    return this.supportService.createTicket(userId, input);
  }

  @ApiOperation({ summary: 'List the authenticated user support tickets' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: PaginatedSupportTicketsResponseDto,
    description: 'Paginated support tickets.',
  })
  @Get('me')
  getMyTickets(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(supportTicketsQuerySchema)) filters: SupportTicketsFilters,
  ): Promise<PaginatedSupportTicketsResponse> {
    return this.supportService.getMyTickets(userId, filters);
  }

  @ApiOperation({ summary: 'Get one support ticket' })
  @ApiParam({ name: 'id', example: 'cm8support123' })
  @ApiOkResponse({ type: SupportTicketRecordDto })
  @Get(':id')
  getTicket(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') ticketId: string,
  ): Promise<SupportTicketRecord> {
    return this.supportService.getTicket(userId, role, ticketId);
  }
}
