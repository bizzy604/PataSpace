import { ApiProperty } from '@nestjs/swagger';

export class CreateUploadUrlRequestDto {
  @ApiProperty({ example: 'living-room.jpg' })
  filename!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'video/mp4'], example: 'image/jpeg' })
  contentType!: 'image/jpeg' | 'image/png' | 'video/mp4';

  @ApiProperty({ example: 2097152 })
  fileSize!: number;
}

export class CreateUploadUrlResponseDto {
  @ApiProperty({
    example: 'https://sandbox-storage.pataspace.local/upload/listings%2Fuser_123%2Fimages%2Ffile.jpg',
  })
  uploadUrl!: string;

  @ApiProperty({ example: 'listings/user_123/images/1711000000-living-room.jpg' })
  s3Key!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;
}

export class ConfirmUploadRequestDto {
  @ApiProperty({ example: 'listings/user_123/images/1711000000-living-room.jpg' })
  s3Key!: string;
}

export class ConfirmUploadResponseDto {
  @ApiProperty({ example: 'listings/user_123/images/1711000000-living-room.jpg' })
  s3Key!: string;

  @ApiProperty({ example: 'http://localhost:3000/sandbox-storage/listings/user_123/images/1711000000-living-room.jpg' })
  url!: string;

  @ApiProperty({ example: 'http://localhost:3000/sandbox-storage/listings/user_123/images/1711000000-living-room.jpg' })
  cdnUrl!: string;
}
