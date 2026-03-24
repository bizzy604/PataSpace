import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  createUnlockSchema,
  CreateUnlockRequest,
  CreateUnlockResponse,
  myUnlocksQuerySchema,
  MyUnlocksFilters,
  PaginatedMyUnlocksResponse,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import {
  CreateUnlockRequestDto,
  CreateUnlockResponseDto,
  MyUnlocksResponseDto,
} from './unlock.docs';
import { UnlockService } from './unlock.service';

@ApiTags('Unlocks')
@ApiBearerAuth('bearer')
@Controller('unlocks')
export class UnlockController {
  constructor(private readonly unlockService: UnlockService) {}

  @ApiOperation({ summary: 'Unlock contact information for a listing' })
  @ApiBody({ type: CreateUnlockRequestDto })
  @ApiCreatedResponse({
    type: CreateUnlockResponseDto,
    description: 'Listing contact details unlocked successfully.',
  })
  @ApiOkResponse({
    type: CreateUnlockResponseDto,
    description: 'Listing was already unlocked; existing payload returned.',
  })
  @ApiRateLimit('unlockCreate')
  @Post()
  async createUnlock(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createUnlockSchema)) input: CreateUnlockRequest,
    @Res({ passthrough: true }) response: { status: (statusCode: number) => void },
  ): Promise<CreateUnlockResponse> {
    const result = await this.unlockService.createUnlock(userId, input);

    response.status(result.created ? 201 : 200);
    return result.payload;
  }

  @ApiOperation({ summary: 'Get the authenticated user unlock history' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending_confirmation', 'confirmed', 'refunded'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: MyUnlocksResponseDto,
    description: 'Paginated unlock history.',
  })
  @Get('my-unlocks')
  getMyUnlocks(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(myUnlocksQuerySchema)) filters: MyUnlocksFilters,
  ): Promise<PaginatedMyUnlocksResponse> {
    return this.unlockService.getMyUnlocks(userId, filters);
  }
}
