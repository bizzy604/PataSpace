/**
 * Purpose: HTTP transport for referrals — exposes POST /referrals and GET /referrals/me.
 * Why important: Thin controller; defers all logic to ReferralService.
 * Used by: app.module.ts via ReferralModule.
 */
import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import {
  createReferralSchema,
  CreateReferralRequest,
  CreateReferralResponse,
  PaginatedReferralsResponse,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateReferralRequestDto,
  PaginatedReferralsResponseDto,
} from './referral.docs';
import { ReferralService } from './referral.service';

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

@ApiTags('Referrals')
@ApiBearerAuth('bearer')
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @ApiOperation({ summary: 'Invite a friend by phone number' })
  @ApiBody({ type: CreateReferralRequestDto })
  @ApiCreatedResponse({
    type: PaginatedReferralsResponseDto,
    description: 'Referral invitation recorded.',
  })
  @HttpCode(201)
  @Post()
  createReferral(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createReferralSchema)) input: CreateReferralRequest,
  ): Promise<CreateReferralResponse> {
    return this.referralService.createReferral(userId, input);
  }

  @ApiOperation({ summary: 'List the authenticated user referrals' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: PaginatedReferralsResponseDto,
    description: 'Paginated referrals.',
  })
  @Get('me')
  listMyReferrals(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(paginationQuerySchema))
    filters: { page?: number; limit?: number },
  ): Promise<PaginatedReferralsResponse> {
    return this.referralService.listMyReferrals(
      userId,
      filters.page ?? 1,
      filters.limit ?? 20,
    );
  }
}
