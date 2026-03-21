import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserProfile } from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserProfileResponseDto } from './user.docs';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({
    type: UserProfileResponseDto,
    description: 'Minimal authenticated user profile for client bootstrap.',
  })
  @Get('me')
  getMe(@CurrentUser('id') userId: string): Promise<UserProfile> {
    return this.userService.getProfileOrThrow(userId);
  }
}
