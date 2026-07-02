/**
 * Purpose: HTTP surface for the admin dispute queue. Requires Role.ADMIN.
 * Why important: Feeds the console's dispute workflow; state transitions run
 *   through the existing /disputes/:id/investigate|resolve|close routes.
 * Used by: apps/web /admin/disputes page via the API.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { adminDisputesQuerySchema, AdminDisputesResponse } from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AdminDisputesQuery,
  AdminDisputeService,
} from './application/admin-dispute.service';
import { AdminDisputesResponseDto } from './docs/admin-disputes.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly adminDisputeService: AdminDisputeService) {}

  @ApiOperation({ summary: 'List disputes with status filtering' })
  @ApiOkResponse({ type: AdminDisputesResponseDto, description: 'Paginated dispute queue.' })
  @Get()
  listDisputes(
    @Query(new ZodValidationPipe(adminDisputesQuerySchema)) query: AdminDisputesQuery,
  ): Promise<AdminDisputesResponse> {
    return this.adminDisputeService.listDisputes(query);
  }
}
