/**
 * Purpose: HTTP transport for the authenticated user's own profile and account.
 * Why important: Exposes `GET /users/me` and the `DELETE /users/me` account-deletion
 *   endpoint that App Store / Play Store policy requires; stays thin, delegating to services.
 * Used by: mobile and web clients via the global Clerk/JWT auth guard.
 */
import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserProfile } from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserProfileResponseDto } from './user.docs';
import { AccountDeletionService } from './account-deletion.service';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly accountDeletion: AccountDeletionService,
  ) {}

  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({
    type: UserProfileResponseDto,
    description: 'Minimal authenticated user profile for client bootstrap.',
  })
  @Get('me')
  getMe(@CurrentUser('id') userId: string): Promise<UserProfile> {
    return this.userService.getProfileOrThrow(userId);
  }

  @ApiOperation({
    summary: 'Permanently delete the authenticated account and all its data',
  })
  @ApiNoContentResponse({ description: 'Account and all associated data deleted.' })
  @Delete('me')
  @HttpCode(204)
  deleteMe(@CurrentUser('id') userId: string): Promise<void> {
    return this.accountDeletion.deleteAccount(userId);
  }
}
