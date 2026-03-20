import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationJob {
  private readonly logger = new Logger(NotificationJob.name);

  handle() {
    this.logger.log('Notification job scaffold ready.');
  }
}
