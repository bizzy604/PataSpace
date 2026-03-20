import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ListingCleanupJob {
  private readonly logger = new Logger(ListingCleanupJob.name);

  handle() {
    this.logger.log('Listing cleanup job scaffold ready.');
  }
}
