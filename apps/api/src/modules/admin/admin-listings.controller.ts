/**
 * Purpose: HTTP surface for admin listing CRUD — full-catalogue browsing,
 *   content edits, and soft deletion. Every route requires Role.ADMIN.
 * Why important: Complements the moderation routes in AdminController
 *   (approve/reject) with the rest of the CRUD surface the console needs.
 * Used by: apps/web /admin/listings pages via the API.
 */
import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  adminDeleteListingSchema,
  adminListingsQuerySchema,
  adminUpdateListingSchema,
  AdminDeleteListingRequest,
  AdminListingsResponse,
  AdminUpdateListingRequest,
  ModerateListingResponse,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminListingService } from './application/admin-listing.service';
import { AdminListingsQuery } from './application/admin-listing.mapper';
import { ModerateListingResponseDto } from './admin.docs';
import {
  AdminDeleteListingRequestDto,
  AdminListingsResponseDto,
  AdminUpdateListingRequestDto,
} from './docs/admin-listings.docs';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly adminListingService: AdminListingService) {}

  @ApiOperation({ summary: 'List all listings across statuses' })
  @ApiOkResponse({
    type: AdminListingsResponseDto,
    description: 'Paginated listing catalogue.',
  })
  @Get()
  listListings(
    @Query(new ZodValidationPipe(adminListingsQuerySchema)) query: AdminListingsQuery,
  ): Promise<AdminListingsResponse> {
    return this.adminListingService.listListings(query);
  }

  @ApiOperation({ summary: 'Edit listing content as an admin' })
  @ApiParam({ name: 'id', example: 'cm8listing123' })
  @ApiBody({ type: AdminUpdateListingRequestDto })
  @ApiOkResponse({ type: ModerateListingResponseDto, description: 'Listing updated.' })
  @Patch(':id')
  updateListing(
    @CurrentUser('id') adminId: string,
    @Param('id') listingId: string,
    @Body(new ZodValidationPipe(adminUpdateListingSchema)) input: AdminUpdateListingRequest,
  ): Promise<ModerateListingResponse> {
    return this.adminListingService.updateListing(adminId, listingId, input);
  }

  @ApiOperation({ summary: 'Soft-delete a listing from the marketplace' })
  @ApiParam({ name: 'id', example: 'cm8listing123' })
  @ApiBody({ type: AdminDeleteListingRequestDto, required: false })
  @ApiOkResponse({ type: ModerateListingResponseDto, description: 'Listing removed.' })
  @Delete(':id')
  deleteListing(
    @CurrentUser('id') adminId: string,
    @Param('id') listingId: string,
    @Body(new ZodValidationPipe(adminDeleteListingSchema))
    input: AdminDeleteListingRequest,
  ): Promise<ModerateListingResponse> {
    return this.adminListingService.deleteListing(adminId, listingId, input);
  }
}
