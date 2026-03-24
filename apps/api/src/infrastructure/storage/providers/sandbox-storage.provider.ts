import { ConfirmUploadInput, CreateUploadUrlInput, StorageProvider } from '../storage.types';

export class SandboxStorageProvider implements StorageProvider {
  constructor(
    private readonly config: {
      failConfirmUpload?: boolean;
      failCreateUploadUrl?: boolean;
      failDeleteObject?: boolean;
      cdnBaseUrl: string;
      publicBaseUrl: string;
    } = {
      cdnBaseUrl: 'http://localhost:3000/sandbox-storage',
      failConfirmUpload: false,
      failCreateUploadUrl: false,
      failDeleteObject: false,
      publicBaseUrl: 'http://localhost:3000/sandbox-storage',
    },
  ) {}

  async createUploadUrl(input: CreateUploadUrlInput) {
    if (this.config.failCreateUploadUrl) {
      throw new Error('Sandbox storage upload-url failure requested by configuration.');
    }

    return {
      provider: 'sandbox',
      key: input.key,
      uploadUrl: `https://sandbox-storage.pataspace.local/upload/${encodeURIComponent(input.key)}`,
      expiresInSeconds: 900,
    };
  }

  async confirmUpload(input: ConfirmUploadInput) {
    if (this.config.failConfirmUpload) {
      throw new Error('Sandbox storage confirm failure requested by configuration.');
    }

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

  async deleteObject(key: string) {
    if (this.config.failDeleteObject) {
      throw new Error('Sandbox storage delete failure requested by configuration.');
    }

    return {
      provider: 'sandbox',
      key,
      deleted: true,
    };
  }

  async healthCheck() {
    const hasFailureInjection =
      this.config.failCreateUploadUrl ||
      this.config.failConfirmUpload ||
      this.config.failDeleteObject;

    return {
      status: hasFailureInjection ? ('degraded' as const) : ('up' as const),
      provider: 'sandbox',
      message: hasFailureInjection
        ? 'Sandbox storage adapter is active with failure injection enabled.'
        : 'Sandbox storage adapter is active.',
    };
  }

  private buildUrl(baseUrl: string, key: string) {
    return `${baseUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
}
