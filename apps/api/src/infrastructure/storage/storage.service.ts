import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.constants';
import { ConfirmUploadInput, CreateUploadUrlInput, StorageProvider } from './storage.types';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider,
  ) {}

  async createUploadUrl(input: CreateUploadUrlInput) {
    return this.provider.createUploadUrl(input);
  }

  async confirmUpload(input: ConfirmUploadInput) {
    return this.provider.confirmUpload(input);
  }

  async deleteObject(key: string) {
    return this.provider.deleteObject(key);
  }

  async healthCheck() {
    return this.provider.healthCheck();
  }
}
