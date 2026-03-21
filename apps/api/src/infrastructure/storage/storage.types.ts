export type ProviderHealth = {
  status: 'up' | 'degraded' | 'down';
  provider: string;
  message?: string;
};

export type CreateUploadUrlInput = {
  key: string;
  contentType: string;
};

export type ConfirmUploadInput = {
  key: string;
  size: number;
  contentType: string;
};

export type UploadUrlResult = {
  provider: string;
  key: string;
  uploadUrl: string;
  expiresInSeconds: number;
};

export type ConfirmUploadResult = {
  provider: string;
  key: string;
  confirmed: boolean;
};

export interface StorageProvider {
  createUploadUrl(input: CreateUploadUrlInput): Promise<UploadUrlResult>;
  confirmUpload(input: ConfirmUploadInput): Promise<ConfirmUploadResult>;
  healthCheck(): Promise<ProviderHealth>;
}
