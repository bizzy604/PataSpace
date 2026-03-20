import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  async get(_key: string) {
    return null;
  }

  async set(_key: string, _value: string, _ttl?: number) {
    return;
  }

  async del(_key: string) {
    return;
  }
}
