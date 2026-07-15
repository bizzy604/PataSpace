/**
 * Purpose: HTTP surface for the admin system-config screen — list the editable
 *   runtime knobs and update one. Requires Role.ADMIN.
 * Why important: These knobs drive live pricing; updates are validated and
 *   audit-logged by SystemConfigService and take effect on the next pricing
 *   computation (new snapshots only).
 * Used by: apps/web /admin/config page via the API.
 */
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AdminConfigEntry,
  AdminConfigResponse,
  UpdateConfigRequest,
  updateConfigSchema,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SystemConfigService } from '../system-config/system-config.service';
import { AdminConfigEntryDto, AdminConfigResponseDto } from './docs/admin-config.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/config')
export class AdminConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @ApiOperation({ summary: 'List editable runtime config with effective values' })
  @ApiOkResponse({ type: AdminConfigResponseDto, description: 'Effective config entries.' })
  @Get()
  async list(): Promise<AdminConfigResponse> {
    return { data: await this.systemConfigService.list() };
  }

  @ApiOperation({ summary: 'Update one config key' })
  @ApiParam({ name: 'key', example: 'pricing.successFeePct' })
  @ApiOkResponse({ type: AdminConfigEntryDto })
  @Put(':key')
  update(
    @CurrentUser('id') adminId: string,
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateConfigSchema)) input: UpdateConfigRequest,
  ): Promise<AdminConfigEntry> {
    return this.systemConfigService.setValue(key, input.value, adminId);
  }
}
