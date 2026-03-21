import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { CacheService } from '../../infrastructure/cache/cache.service';

const BROWSE_CACHE_TTL_SECONDS = 300;
const BROWSE_VERSION_KEY = 'listing:browse:version';

@Injectable()
export class ListingCacheService {
  constructor(private readonly cacheService: CacheService) {}

  async getBrowse<T>(viewerKey: string, filters: unknown) {
    const version = await this.getVersion(BROWSE_VERSION_KEY);

    return this.cacheService.get<T>(this.buildBrowseKey(version, viewerKey, filters));
  }

  async setBrowse(viewerKey: string, filters: unknown, value: unknown) {
    const version = await this.getVersion(BROWSE_VERSION_KEY);

    await this.cacheService.set(
      this.buildBrowseKey(version, viewerKey, filters),
      value,
      BROWSE_CACHE_TTL_SECONDS,
    );
  }

  async getDetails<T>(listingId: string, viewerKey: string) {
    const version = await this.getVersion(this.detailVersionKey(listingId));

    return this.cacheService.get<T>(this.buildDetailKey(listingId, version, viewerKey));
  }

  async setDetails(listingId: string, viewerKey: string, value: unknown) {
    const version = await this.getVersion(this.detailVersionKey(listingId));

    await this.cacheService.set(
      this.buildDetailKey(listingId, version, viewerKey),
      value,
      BROWSE_CACHE_TTL_SECONDS,
    );
  }

  async invalidateBrowse() {
    await this.cacheService.increment(BROWSE_VERSION_KEY);
  }

  async invalidateListing(listingId: string) {
    await Promise.all([
      this.cacheService.increment(BROWSE_VERSION_KEY),
      this.cacheService.increment(this.detailVersionKey(listingId)),
    ]);
  }

  private async getVersion(key: string) {
    return (await this.cacheService.get<number>(key)) ?? 1;
  }

  private buildBrowseKey(version: number, viewerKey: string, filters: unknown) {
    return `listing:browse:v${version}:${viewerKey}:${this.hash(filters)}`;
  }

  private buildDetailKey(listingId: string, version: number, viewerKey: string) {
    return `listing:detail:${listingId}:v${version}:${viewerKey}`;
  }

  private detailVersionKey(listingId: string) {
    return `listing:detail:${listingId}:version`;
  }

  private hash(value: unknown) {
    return createHash('sha1').update(JSON.stringify(value)).digest('hex');
  }
}
