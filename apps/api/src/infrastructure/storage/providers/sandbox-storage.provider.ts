import { ConfirmUploadInput, CreateUploadUrlInput, StorageProvider } from '../storage.types';

export class SandboxStorageProvider implements StorageProvider {
  async createUploadUrl(input: CreateUploadUrlInput) {
    return {
      provider: 'sandbox',
      key: input.key,
      uploadUrl: `https://sandbox-storage.pataspace.local/upload/${encodeURIComponent(input.key)}`,
      expiresInSeconds: 900,
    };
  }

  async confirmUpload(input: ConfirmUploadInput) {
    return {
      provider: 'sandbox',
      key: input.key,
      confirmed: input.size >= 0 && input.contentType.length > 0,
    };
  }

  async healthCheck() {
    return {
      status: 'up' as const,
      provider: 'sandbox',
      message: 'Sandbox storage adapter is active.',
    };
  }
}
