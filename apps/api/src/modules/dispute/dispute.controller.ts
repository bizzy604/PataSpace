import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  createDisputeSchema,
  CreateDisputeRequest,
  CreateDisputeResponse,
  DisputeRecord,
  resolveDisputeSchema,
  ResolveDisputeRequest,
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateDisputeRequestDto,
  CreateDisputeResponseDto,
  DisputeRecordDto,
  ResolveDisputeRequestDto,
} from './dispute.docs';
import { DisputeService } from './dispute.service';

@ApiTags('Disputes')
@ApiBearerAuth('bearer')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @ApiOperation({ summary: 'Create a dispute for an unlock' })
  @ApiBody({ type: CreateDisputeRequestDto })
  @ApiCreatedResponse({
    type: CreateDisputeResponseDto,
    description: 'Dispute filed successfully.',
  })
  @HttpCode(201)
  @Post()
  createDispute(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createDisputeSchema)) input: CreateDisputeRequest,
  ): Promise<CreateDisputeResponse> {
    return this.disputeService.createDispute(userId, input);
  }

  @ApiOperation({ summary: 'Get dispute details' })
  @ApiParam({ name: 'id', example: 'cm8dispute123' })
  @ApiOkResponse({
    type: DisputeRecordDto,
    description: 'Dispute details.',
  })
  @Get(':id')
  getDispute(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') disputeId: string,
  ): Promise<DisputeRecord> {
    return this.disputeService.getDispute(userId, role, disputeId);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Move a dispute into investigation' })
  @ApiParam({ name: 'id', example: 'cm8dispute123' })
  @ApiOkResponse({
    type: DisputeRecordDto,
    description: 'Dispute moved to investigating.',
  })
  @Post(':id/investigate')
  investigateDispute(
    @CurrentUser('id') adminId: string,
    @Param('id') disputeId: string,
  ): Promise<DisputeRecord> {
    return this.disputeService.investigateDispute(adminId, disputeId);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Resolve a dispute with or without refund' })
  @ApiParam({ name: 'id', example: 'cm8dispute123' })
  @ApiBody({ type: ResolveDisputeRequestDto })
  @ApiOkResponse({
    type: DisputeRecordDto,
    description: 'Dispute resolved successfully.',
  })
  @Post(':id/resolve')
  resolveDispute(
    @CurrentUser('id') adminId: string,
    @Param('id') disputeId: string,
    @Body(new ZodValidationPipe(resolveDisputeSchema)) input: ResolveDisputeRequest,
  ): Promise<DisputeRecord> {
    return this.disputeService.resolveDispute(adminId, disputeId, input);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Close a resolved dispute' })
  @ApiParam({ name: 'id', example: 'cm8dispute123' })
  @ApiOkResponse({
    type: DisputeRecordDto,
    description: 'Dispute closed successfully.',
  })
  @Post(':id/close')
  closeDispute(
    @CurrentUser('id') adminId: string,
    @Param('id') disputeId: string,
  ): Promise<DisputeRecord> {
    return this.disputeService.closeDispute(adminId, disputeId);
  }
}
