/**
 * Purpose: HTTP surface for the admin dashboard metrics. Requires Role.ADMIN.
 * Why important: One endpoint feeds every dashboard tile in the console.
 * Used by: apps/web /admin dashboard via the API.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminMetricsResponse } from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminMetricsService } from './application/admin-metrics.service';
import { AdminMetricsResponseDto } from './docs/admin-metrics.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/metrics')
export class AdminMetricsController {
  constructor(private readonly adminMetricsService: AdminMetricsService) {}

  @ApiOperation({ summary: 'Get marketplace-wide dashboard metrics' })
  @ApiOkResponse({ type: AdminMetricsResponseDto, description: 'Dashboard counts.' })
  @Get()
  getMetrics(): Promise<AdminMetricsResponse> {
    return this.adminMetricsService.getMetrics();
  }
}
