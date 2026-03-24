import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  createConfirmationSchema,
  CreateConfirmationRequest,
  CreateConfirmationResponse,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateConfirmationRequestDto,
  CreateConfirmationResponseDto,
} from './confirmation.docs';
import { ConfirmationService } from './confirmation.service';

@ApiTags('Confirmations')
@ApiBearerAuth('bearer')
@Controller('confirmations')
export class ConfirmationController {
  constructor(private readonly confirmationService: ConfirmationService) {}

  @ApiOperation({ summary: 'Confirm a connection for an unlocked listing' })
  @ApiBody({ type: CreateConfirmationRequestDto })
  @ApiCreatedResponse({
    type: CreateConfirmationResponseDto,
    description: 'Confirmation recorded successfully.',
  })
  @HttpCode(201)
  @Post()
  createConfirmation(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createConfirmationSchema)) input: CreateConfirmationRequest,
  ): Promise<CreateConfirmationResponse> {
    return this.confirmationService.createConfirmation(userId, input);
  }
}
