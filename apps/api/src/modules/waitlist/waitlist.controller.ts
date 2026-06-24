/**
 * Purpose: HTTP transport for the waitlist feature — exposes POST /waitlist and GET /waitlist/count.
 * Why important: Public endpoints that let visitors join the pre-launch waitlist without auth.
 * Used by: app.module.ts via WaitlistModule.
 */
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import {
  JoinWaitlistRequestDto,
  WaitlistCountResponseDto,
  WaitlistEntryResponseDto,
} from './waitlist.docs';
import { WaitlistService } from './waitlist.service';

const joinWaitlistSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
});

@ApiTags('Waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Public()
  @ApiRateLimit('waitlistJoin')
  @ApiOperation({ summary: 'Join the pre-launch waitlist' })
  @ApiBody({ type: JoinWaitlistRequestDto })
  @ApiCreatedResponse({
    type: WaitlistEntryResponseDto,
    description: 'Successfully joined the waitlist.',
  })
  @ApiConflictResponse({ description: 'Email already on the waitlist.' })
  @HttpCode(201)
  @Post()
  join(@Body(new ZodValidationPipe(joinWaitlistSchema)) input: JoinWaitlistRequestDto) {
    return this.waitlistService.join(input);
  }

  @Public()
  @ApiOperation({ summary: 'Get the current waitlist count' })
  @ApiOkResponse({
    type: WaitlistCountResponseDto,
    description: 'Current number of waitlist signups.',
  })
  @Get('count')
  getCount() {
    return this.waitlistService.getCount();
  }
}
