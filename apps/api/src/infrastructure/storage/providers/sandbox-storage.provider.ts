import { ConfirmUploadInput, CreateUploadUrlInput, StorageProvider } from '../storage.types';

export class SandboxStorageProvider implements StorageProvider {
  constructor(
    private readonly config: {
      cdnBaseUrl: string;
      publicBaseUrl: string;
    } = {
      cdnBaseUrl: 'http://localhost:3000/sandbox-storage',
      publicBaseUrl: 'http://localhost:3000/sandbox-storage',
    },
  ) {}

  async createUploadUrl(input: CreateUploadUrlInput) {
    return {
      provider: 'sandbox',
      key: input.key,
      uploadUrl: `https://sandbox-storage.pataspace.local/upload/${encodeURIComponent(input.key)}`,
      expiresInSeconds: 900,
    };
  }

  async confirmUpload(input: ConfirmUploadInput) {
    const url = this.buildUrl(this.config.publicBaseUrl, input.key);
    const cdnUrl = this.buildUrl(this.config.cdnBaseUrl, input.key);

    return {
      provider: 'sandbox',
      key: input.key,
      confirmed: input.size >= 0 && input.contentType.length > 0,
      url,
      cdnUrl,
    };
  }

  async healthCheck() {
    return {
      status: 'up' as const,
      provider: 'sandbox',
      message: 'Sandbox storage adapter is active.',
    };
  }

  private buildUrl(baseUrl: string, key: string) {
    return `${baseUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
}
