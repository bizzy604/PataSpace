/**
 * Purpose: HTTP surface for the admin support workspace — triage queue, ticket
 *   detail with thread, admin replies, and status/priority transitions.
 * Why important: Turns the accumulating support inbox into an actionable
 *   workflow; every route is Role.ADMIN-gated and mutations are audit-logged.
 * Used by: apps/web /admin/support page via the API.
 */
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminSupportTicketDetail,
  AdminSupportTicketsResponse,
  PostSupportMessageRequest,
  SupportTicketMessageRecord,
  UpdateSupportTicketPriorityRequest,
  UpdateSupportTicketStatusRequest,
  adminSupportTicketsQuerySchema,
  postSupportMessageSchema,
  updateSupportTicketPrioritySchema,
  updateSupportTicketStatusSchema,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AdminSupportService,
  AdminSupportTicketsQuery,
} from './application/admin-support.service';
import { AdminSupportActionsService } from './application/admin-support-actions.service';
import {
  AdminSupportTicketDetailDto,
  AdminSupportTicketsResponseDto,
  SupportTicketMessageRecordDto,
} from './docs/admin-support.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/support/tickets')
export class AdminSupportController {
  constructor(
    private readonly supportService: AdminSupportService,
    private readonly actionsService: AdminSupportActionsService,
  ) {}

  @ApiOperation({ summary: 'List support tickets with status/priority filters' })
  @ApiOkResponse({ type: AdminSupportTicketsResponseDto, description: 'Paginated triage queue.' })
  @Get()
  listTickets(
    @Query(new ZodValidationPipe(adminSupportTicketsQuerySchema))
    query: AdminSupportTicketsQuery,
  ): Promise<AdminSupportTicketsResponse> {
    return this.supportService.listTickets(query);
  }

  @ApiOperation({ summary: 'Get one ticket with reporter profile and thread' })
  @ApiParam({ name: 'id', example: 'cm8ticket123' })
  @ApiOkResponse({ type: AdminSupportTicketDetailDto })
  @Get(':id')
  getTicket(@Param('id') ticketId: string): Promise<AdminSupportTicketDetail> {
    return this.supportService.getTicketDetail(ticketId);
  }

  @ApiOperation({ summary: 'Post an admin reply to the ticket thread' })
  @ApiParam({ name: 'id', example: 'cm8ticket123' })
  @ApiOkResponse({ type: SupportTicketMessageRecordDto })
  @HttpCode(201)
  @Post(':id/messages')
  postReply(
    @CurrentUser('id') adminId: string,
    @Param('id') ticketId: string,
    @Body(new ZodValidationPipe(postSupportMessageSchema)) input: PostSupportMessageRequest,
  ): Promise<SupportTicketMessageRecord> {
    return this.actionsService.postReply(adminId, ticketId, input);
  }

  @ApiOperation({ summary: 'Transition ticket status' })
  @ApiParam({ name: 'id', example: 'cm8ticket123' })
  @HttpCode(200)
  @Post(':id/status')
  updateStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') ticketId: string,
    @Body(new ZodValidationPipe(updateSupportTicketStatusSchema))
    input: UpdateSupportTicketStatusRequest,
  ) {
    return this.actionsService.updateStatus(adminId, ticketId, input);
  }

  @ApiOperation({ summary: 'Change ticket priority' })
  @ApiParam({ name: 'id', example: 'cm8ticket123' })
  @HttpCode(200)
  @Post(':id/priority')
  updatePriority(
    @CurrentUser('id') adminId: string,
    @Param('id') ticketId: string,
    @Body(new ZodValidationPipe(updateSupportTicketPrioritySchema))
    input: UpdateSupportTicketPriorityRequest,
  ) {
    return this.actionsService.updatePriority(adminId, ticketId, input);
  }
}
