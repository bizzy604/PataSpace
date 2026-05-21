/**
 * Purpose: HTTP transport for unlock reviews — exposes POST /reviews.
 * Why important: Thin controller; defers all logic to ReviewService.
 * Used by: app.module.ts via ReviewModule.
 */
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  createReviewSchema,
  CreateReviewRequest,
  CreateReviewResponse,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateReviewRequestDto, ReviewRecordDto } from './review.docs';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@ApiBearerAuth('bearer')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({ summary: 'Leave a review for a confirmed unlock' })
  @ApiBody({ type: CreateReviewRequestDto })
  @ApiCreatedResponse({ type: ReviewRecordDto, description: 'Review created.' })
  @HttpCode(201)
  @Post()
  createReview(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createReviewSchema)) input: CreateReviewRequest,
  ): Promise<CreateReviewResponse> {
    return this.reviewService.createReview(userId, input);
  }
}
