import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminPendingListingsResponse,
  ModerateListingResponse,
  rejectListingSchema,
  RejectListingRequest,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AdminPendingListingsResponseDto,
  ModerateListingResponseDto,
  RejectListingRequestDto,
} from './admin.docs';
import { ListingService } from '../listing/listing.service';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly listingService: ListingService) {}

  @ApiOperation({ summary: 'Get listings awaiting admin review' })
  @ApiOkResponse({
    type: AdminPendingListingsResponseDto,
    description: 'Pending listing review queue.',
  })
  @Get('listings/pending')
  getPendingListings(): Promise<AdminPendingListingsResponse> {
    return this.listingService.getPendingListings();
  }

  @ApiOperation({ summary: 'Approve a pending listing' })
  @ApiParam({ name: 'id', example: 'cm8listing123' })
  @ApiOkResponse({
    type: ModerateListingResponseDto,
    description: 'Listing approved successfully.',
  })
  @HttpCode(200)
  @Post('listings/:id/approve')
  approveListing(
    @CurrentUser('id') adminId: string,
    @Param('id') listingId: string,
  ): Promise<ModerateListingResponse> {
    return this.listingService.approveListing(adminId, listingId);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Reject a pending listing' })
  @ApiParam({ name: 'id', example: 'cm8listing123' })
  @ApiBody({ type: RejectListingRequestDto })
  @ApiOkResponse({
    type: ModerateListingResponseDto,
    description: 'Listing rejected successfully.',
  })
  @Post('listings/:id/reject')
  rejectListing(
    @CurrentUser('id') adminId: string,
    @Param('id') listingId: string,
    @Body(new ZodValidationPipe(rejectListingSchema)) input: RejectListingRequest,
  ): Promise<ModerateListingResponse> {
    return this.listingService.rejectListing(adminId, listingId, input);
  }
}
