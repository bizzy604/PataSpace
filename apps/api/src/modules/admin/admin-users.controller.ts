/**
 * Purpose: HTTP surface for admin user management — directory, detail, and
 *   ban/unban. Every route requires Role.ADMIN.
 * Why important: This is the console's only path to user accounts; keeping it
 *   thin means all policy (self-ban, admin-ban, session revocation) lives in
 *   AdminUserService where it is unit-tested.
 * Used by: apps/web /admin/users pages via the API.
 */
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  adminUsersQuerySchema,
  banUserSchema,
  AdminUserActionResponse,
  AdminUserDetail,
  AdminUsersResponse,
  BanUserRequest,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUserService } from './application/admin-user.service';
import { AdminUsersQuery } from './application/admin-user.mapper';
import {
  AdminUserActionResponseDto,
  AdminUserDetailDto,
  AdminUsersResponseDto,
  BanUserRequestDto,
} from './docs/admin-users.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @ApiOperation({ summary: 'List users with filters and pagination' })
  @ApiOkResponse({ type: AdminUsersResponseDto, description: 'Paginated user directory.' })
  @Get()
  listUsers(
    @Query(new ZodValidationPipe(adminUsersQuerySchema)) query: AdminUsersQuery,
  ): Promise<AdminUsersResponse> {
    return this.adminUserService.listUsers(query);
  }

  @ApiOperation({ summary: 'Get a single user with account detail' })
  @ApiParam({ name: 'id', example: 'cm8user123' })
  @ApiOkResponse({ type: AdminUserDetailDto, description: 'Full user detail.' })
  @Get(':id')
  getUser(@Param('id') userId: string): Promise<AdminUserDetail> {
    return this.adminUserService.getUserDetail(userId);
  }

  @ApiOperation({ summary: 'Ban a user and revoke their sessions' })
  @ApiParam({ name: 'id', example: 'cm8user123' })
  @ApiBody({ type: BanUserRequestDto })
  @ApiOkResponse({ type: AdminUserActionResponseDto, description: 'User banned.' })
  @HttpCode(200)
  @Post(':id/ban')
  banUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(banUserSchema)) input: BanUserRequest,
  ): Promise<AdminUserActionResponse> {
    return this.adminUserService.banUser(adminId, userId, input);
  }

  @ApiOperation({ summary: 'Unban a user and reactivate the account' })
  @ApiParam({ name: 'id', example: 'cm8user123' })
  @ApiOkResponse({ type: AdminUserActionResponseDto, description: 'User unbanned.' })
  @HttpCode(200)
  @Post(':id/unban')
  unbanUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
  ): Promise<AdminUserActionResponse> {
    return this.adminUserService.unbanUser(adminId, userId);
  }
}
