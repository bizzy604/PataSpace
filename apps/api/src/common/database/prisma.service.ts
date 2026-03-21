import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly requestContext: RequestContextService) {
    const isProduction = process.env.NODE_ENV === 'production';

    super({
      log: isProduction
        ? [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
      errorFormat: 'minimal',
    });

    if (!isProduction) {
      this.$on('query' as never, (event: Prisma.QueryEvent) => {
        this.logger.debug(
          JSON.stringify({
            event: 'prisma.query',
            durationMs: event.duration,
            target: event.target,
            requestId: this.requestContext.getRequestId() ?? null,
          }),
        );
      });
    }

    this.$on('info' as never, (event: Prisma.LogEvent) => {
      this.logger.log(
        JSON.stringify({
          event: 'prisma.info',
          message: event.message,
          target: event.target,
          requestId: this.requestContext.getRequestId() ?? null,
        }),
      );
    });

    this.$on('warn' as never, (event: Prisma.LogEvent) => {
      this.logger.warn(
        JSON.stringify({
          event: 'prisma.warn',
          message: event.message,
          target: event.target,
          requestId: this.requestContext.getRequestId() ?? null,
        }),
      );
    });

    this.$on('error' as never, (event: Prisma.LogEvent) => {
      this.logger.error(
        JSON.stringify({
          event: 'prisma.error',
          message: event.message,
          target: event.target,
          requestId: this.requestContext.getRequestId() ?? null,
        }),
      );
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma client connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma client disconnected');
  }
}
