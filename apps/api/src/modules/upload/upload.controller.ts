import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  confirmUploadSchema,
  CreateUploadUrlRequest,
  CreateUploadUrlResponse,
  createUploadUrlSchema,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import {
  ConfirmUploadRequestDto,
  ConfirmUploadResponseDto,
  CreateUploadUrlRequestDto,
  CreateUploadUrlResponseDto,
} from './upload.docs';
import { UploadService } from './upload.service';

@ApiTags('Uploads')
@ApiBearerAuth('bearer')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: 'Generate a presigned upload URL for a listing photo or video' })
  @ApiBody({ type: CreateUploadUrlRequestDto })
  @ApiOkResponse({
    type: CreateUploadUrlResponseDto,
    description: 'Presigned URL created successfully.',
  })
  @ApiRateLimit('uploadCreate')
  @HttpCode(200)
  @Post('presigned-url')
  createPresignedUrl(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createUploadUrlSchema)) input: CreateUploadUrlRequest,
  ): Promise<CreateUploadUrlResponse> {
    return this.uploadService.createPresignedUrl(userId, input);
  }

  @ApiOperation({ summary: 'Confirm that an uploaded media asset exists and is ready to attach' })
  @ApiBody({ type: ConfirmUploadRequestDto })
  @ApiOkResponse({
    type: ConfirmUploadResponseDto,
    description: 'Upload confirmed successfully.',
  })
  @ApiRateLimit('uploadConfirm')
  @HttpCode(200)
  @Post('confirm')
  confirmUpload(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(confirmUploadSchema)) input: ConfirmUploadRequest,
  ): Promise<ConfirmUploadResponse> {
    return this.uploadService.confirmUpload(userId, input);
  }
}
