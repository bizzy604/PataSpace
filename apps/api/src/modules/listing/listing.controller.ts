import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  createListingSchema,
  CreateListingRequest,
  CreateListingResponse,
  listingFiltersSchema,
  ListingDetails,
  ListingFilters,
  myListingsQuerySchema,
  MyListingsFilters,
  PaginatedListingsResponse,
  PaginatedMyListingsResponse,
  updateListingSchema,
  UpdateListingRequest,
  UpdateListingResponse,
} from '@pataspace/contracts';
import { AuthenticatedRequest, AuthenticatedUser } from '../../common/auth/authenticated-request.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { createStrongEtag, matchesIfNoneMatch } from '../../common/http/etag.util';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import {
  BrowseListingsResponseDto,
  CreateListingRequestDto,
  CreateListingResponseDto,
  ListingDetailsDto,
  MyListingsResponseDto,
  UpdateListingRequestDto,
  UpdateListingResponseDto,
} from './listing.docs';
import { ListingService } from './listing.service';

@ApiTags('Listings')
@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Browse approved listings with filters and pagination' })
  @ApiOkResponse({
    type: BrowseListingsResponseDto,
    description: 'Paginated browse response.',
  })
  @Get()
  async browseListings(
    @Query(new ZodValidationPipe(listingFiltersSchema)) filters: ListingFilters,
    @CurrentUser() currentUser: AuthenticatedUser | undefined,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: any,
  ): Promise<PaginatedListingsResponse | void> {
    const payload = await this.listingService.browseListings(filters, currentUser);
    const etag = createStrongEtag(payload);

    response.setHeader('ETag', etag);

    if (matchesIfNoneMatch(request.headers['if-none-match'], etag)) {
      response.status(304);
      return;
    }

    return payload;
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the current user listings, including pending and deleted items' })
  @ApiOkResponse({
    type: MyListingsResponseDto,
    description: 'Paginated listing response for the authenticated owner.',
  })
  @Get('my-listings')
  getMyListings(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(myListingsQuerySchema)) filters: MyListingsFilters,
  ): Promise<PaginatedMyListingsResponse> {
    return this.listingService.getMyListings(userId, filters);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get listing details. Contact information is only included when authorized.',
  })
  @ApiParam({ name: 'id', example: 'cm8listing123' })
  @ApiOkResponse({
    type: ListingDetailsDto,
    description: 'Full listing details response.',
  })
  @Get(':id')
  async getListingDetails(
    @Param('id') listingId: string,
    @CurrentUser() currentUser: AuthenticatedUser | undefined,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: any,
  ): Promise<ListingDetails | void> {
    const payload = await this.listingService.getListingDetails(listingId, currentUser);
    const etag = createStrongEtag(payload);

    response.setHeader('ETag', etag);

    if (matchesIfNoneMatch(request.headers['if-none-match'], etag)) {
      response.status(304);
      return;
    }

    return payload;
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new listing from a mobile device' })
  @ApiHeader({
    name: 'X-Device-Type',
    required: true,
    description: 'Must be set to `mobile` for listing creation.',
  })
  @ApiBody({ type: CreateListingRequestDto })
  @ApiCreatedResponse({
    type: CreateListingResponseDto,
    description: 'Listing created successfully.',
  })
  @ApiRateLimit('listingCreate')
  @Post()
  createListing(
    @CurrentUser('id') userId: string,
    @Headers('x-device-type') deviceType: string | undefined,
    @Body(new ZodValidationPipe(createListingSchema)) input: CreateListingRequest,
  ): Promise<CreateListingResponse> {
    return this.listingService.createListing(userId, deviceType, input);
  }

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update an existing listing owned by the authenticated user' })
  @ApiParam({ name: 'id', example: 'cm8listing123' })
  @ApiBody({ type: UpdateListingRequestDto })
  @ApiOkResponse({
    type: UpdateListingResponseDto,
    description: 'Listing updated successfully.',
  })
  @Patch(':id')
  updateListing(
    @CurrentUser('id') userId: string,
    @Param('id') listingId: string,
    @Body(new ZodValidationPipe(updateListingSchema)) input: UpdateListingRequest,
  ): Promise<UpdateListingResponse> {
    return this.listingService.updateListing(userId, listingId, input);
  }

  @ApiBearerAuth('bearer')
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft delete an existing listing owned by the authenticated user' })
  @ApiParam({ name: 'id', example: 'cm8listing123' })
  @ApiNoContentResponse({
    description: 'Listing deleted successfully.',
  })
  @Delete(':id')
  async deleteListing(
    @CurrentUser('id') userId: string,
    @Param('id') listingId: string,
  ) {
    await this.listingService.softDeleteListing(userId, listingId);
  }
}
