import {
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfirmUploadInput, CreateUploadUrlInput, StorageProvider } from '../storage.types';

type S3StorageConfig = {
  accessKeyId: string;
  bucket: string;
  cdnBaseUrl: string;
  presignTtlSeconds: number;
  publicBaseUrl: string;
  region: string;
  secretAccessKey: string;
};

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(
    private readonly config: S3StorageConfig,
    client?: S3Client,
  ) {
    this.client =
      client ??
      new S3Client({
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        region: this.config.region,
      });
  }

  async createUploadUrl(input: CreateUploadUrlInput) {
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.config.bucket,
        ContentType: input.contentType,
        Key: input.key,
      }),
      {
        expiresIn: this.config.presignTtlSeconds,
      },
    );

    return {
      provider: 's3',
      key: input.key,
      uploadUrl,
      expiresInSeconds: this.config.presignTtlSeconds,
    };
  }

  async confirmUpload(input: ConfirmUploadInput) {
    const url = this.buildUrl(this.config.publicBaseUrl, input.key);
    const cdnUrl = this.buildUrl(this.config.cdnBaseUrl, input.key);

    try {
      const object = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: input.key,
        }),
      );

      return {
        provider: 's3',
        key: input.key,
        confirmed:
          (object.ContentLength === undefined || object.ContentLength === input.size) &&
          (object.ContentType === undefined || object.ContentType === input.contentType),
        url,
        cdnUrl,
      };
    } catch {
      return {
        provider: 's3',
        key: input.key,
        confirmed: false,
        url,
        cdnUrl,
      };
    }
  }

  async healthCheck() {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.config.bucket,
        }),
      );

      return {
        status: 'up' as const,
        provider: 's3',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        provider: 's3',
        message: error instanceof Error ? error.message : 'S3 health check failed',
      };
    }
  }

  private buildUrl(baseUrl: string, key: string) {
    return `${baseUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
}
