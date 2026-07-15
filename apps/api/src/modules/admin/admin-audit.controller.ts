/**
 * Purpose: HTTP surface for the admin audit-log console — a filtered list and
 *   a CSV export over the same filters. Requires Role.ADMIN.
 * Why important: The security review screen and its export both run through
 *   here; the export streams text/csv with an attachment disposition.
 * Used by: apps/web /admin/audit-logs page via the API.
 */
import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuditLogsResponse, adminAuditLogsQuerySchema } from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AdminAuditLogsQuery,
  AdminAuditService,
} from './application/admin-audit.service';
import { AdminAuditLogsResponseDto } from './docs/admin-audit.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @ApiOperation({ summary: 'List audit-log entries with filters' })
  @ApiOkResponse({ type: AdminAuditLogsResponseDto, description: 'Paginated audit trail.' })
  @Get()
  listLogs(
    @Query(new ZodValidationPipe(adminAuditLogsQuerySchema)) query: AdminAuditLogsQuery,
  ): Promise<AdminAuditLogsResponse> {
    return this.adminAuditService.listLogs(query);
  }

  @ApiOperation({ summary: 'Export the filtered audit trail as CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="audit-logs.csv"')
  @Get('export')
  exportCsv(
    @Query(new ZodValidationPipe(adminAuditLogsQuerySchema)) query: AdminAuditLogsQuery,
  ): Promise<string> {
    return this.adminAuditService.collectCsv(query);
  }
}
