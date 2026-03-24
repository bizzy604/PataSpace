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
} from '@pataspace/contracts';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateDisputeRequestDto,
  CreateDisputeResponseDto,
  DisputeRecordDto,
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
}
