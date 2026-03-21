import {
  ConfirmUploadInput,
  ConfirmUploadResult,
  CreateUploadUrlInput,
  StorageProvider,
  UploadUrlResult,
} from '../storage.types';

export class DisabledStorageProvider implements StorageProvider {
  constructor(private readonly provider: string) {}

  async createUploadUrl(_input: CreateUploadUrlInput): Promise<UploadUrlResult> {
    throw new Error(`${this.provider} storage provider is not implemented yet.`);
  }

  async confirmUpload(_input: ConfirmUploadInput): Promise<ConfirmUploadResult> {
    throw new Error(`${this.provider} storage provider is not implemented yet.`);
  }

  async healthCheck() {
    return {
      status: 'degraded' as const,
      provider: this.provider,
      message: 'Live storage integration is not implemented yet. Use sandbox mode during Sprint 0.',
    };
  }
}
