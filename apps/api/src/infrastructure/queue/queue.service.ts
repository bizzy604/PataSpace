import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue } from 'bullmq';
import {
  DEFAULT_QUEUE_NAME,
  NOTIFICATIONS_QUEUE_NAME,
  PAYMENTS_QUEUE_NAME,
} from './queue.constants';

export type QueueName =
  | typeof DEFAULT_QUEUE_NAME
  | typeof NOTIFICATIONS_QUEUE_NAME
  | typeof PAYMENTS_QUEUE_NAME;

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queues: Record<QueueName, Queue>;

  constructor(private readonly configService: ConfigService) {
    this.queues = {
      [DEFAULT_QUEUE_NAME]: this.createQueue(DEFAULT_QUEUE_NAME),
      [NOTIFICATIONS_QUEUE_NAME]: this.createQueue(NOTIFICATIONS_QUEUE_NAME),
      [PAYMENTS_QUEUE_NAME]: this.createQueue(PAYMENTS_QUEUE_NAME),
    };
  }

  async add(
    queueName: QueueName,
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ) {
    return this.queues[queueName].add(jobName, payload, options);
  }

  async addNotification(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ) {
    return this.add(NOTIFICATIONS_QUEUE_NAME, jobName, payload, options);
  }

  async addPayment(jobName: string, payload: Record<string, unknown>, options?: JobsOptions) {
    return this.add(PAYMENTS_QUEUE_NAME, jobName, payload, options);
  }

  async healthCheck() {
    try {
      const client = await this.queues[DEFAULT_QUEUE_NAME].client;
      await client.ping();

      return {
        status: 'up' as const,
        provider: 'bullmq',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        provider: 'bullmq',
        message: error instanceof Error ? error.message : 'Queue connection failed',
      };
    }
  }

  async onModuleDestroy() {
    await Promise.all(Object.values(this.queues).map((queue) => queue.close()));
  }

  private createQueue(name: QueueName) {
    return new Queue(name, {
      connection: {
        host: this.configService.get<string>('infrastructure.redis.host') ?? 'localhost',
        port: this.configService.get<number>('infrastructure.redis.port') ?? 6379,
        password: this.configService.get<string>('infrastructure.redis.password') || undefined,
        db: this.configService.get<number>('infrastructure.redis.db') ?? 0,
      },
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
      prefix: this.configService.get<string>('infrastructure.queue.prefix') ?? 'pataspace',
    });
  }
}
