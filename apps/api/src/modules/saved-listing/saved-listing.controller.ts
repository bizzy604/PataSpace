/**
 * Purpose: HTTP transport for tenant saved listings.
 * Why important: Thin controller; defers all logic to SavedListingService.
 * Used by: app.module.ts via SavedListingModule.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import {
  PaginatedSavedListingsResponse,
  SaveListingRequest,
  SaveListingResponse,
  saveListingSchema,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  PaginatedSavedListingsResponseDto,
  SaveListingRequestDto,
  SavedListingRecordDto,
} from './saved-listing.docs';
import { SavedListingService } from './saved-listing.service';

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

@ApiTags('Saved Listings')
@ApiBearerAuth('bearer')
@Controller('me/saved-listings')
export class SavedListingController {
  constructor(private readonly savedListingService: SavedListingService) {}

  @ApiOperation({ summary: 'Save a listing to the authenticated user list' })
  @ApiBody({ type: SaveListingRequestDto })
  @ApiCreatedResponse({
    type: SavedListingRecordDto,
    description: 'Listing saved.',
  })
  @HttpCode(201)
  @Post()
  saveListing(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(saveListingSchema)) input: SaveListingRequest,
  ): Promise<SaveListingResponse> {
    return this.savedListingService.saveListing(userId, input.listingId);
  }

  @ApiOperation({ summary: 'List the authenticated user saved listings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: PaginatedSavedListingsResponseDto,
    description: 'Paginated saved listings.',
  })
  @Get()
  listSavedListings(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(paginationQuerySchema))
    filters: { page?: number; limit?: number },
  ): Promise<PaginatedSavedListingsResponse> {
    return this.savedListingService.listSavedListings(
      userId,
      filters.page ?? 1,
      filters.limit ?? 20,
    );
  }

  @ApiOperation({ summary: 'Remove a listing from the authenticated user saved list' })
  @ApiParam({ name: 'listingId', example: 'cm8listing123' })
  @ApiNoContentResponse({ description: 'Saved listing removed.' })
  @HttpCode(204)
  @Delete(':listingId')
  async unsaveListing(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
  ): Promise<void> {
    await this.savedListingService.unsaveListing(userId, listingId);
  }
}
