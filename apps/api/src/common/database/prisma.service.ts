import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { buildRlsContext } from './rls-context.util';
import { RequestContextService } from '../request-context/request-context.service';

const RLS_DELEGATE_KEYS = [
  'user',
  'refreshToken',
  'oTPCode',
  'credit',
  'creditTransaction',
  'listing',
  'listingPhoto',
  'uploadedAsset',
  'unlock',
  'confirmation',
  'commission',
  'dispute',
  'auditLog',
  'systemConfig',
] as const;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly rlsClient: PrismaClient;

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

    this.rlsClient = this.createRlsClient();
    this.bindRlsDelegates();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma client connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma client disconnected');
  }

  override $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<{ [K in keyof P]: Awaited<P[K]> }>;
  override $transaction<R>(
    fn: (prisma: Prisma.TransactionClient) => Promise<R>,
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
      maxWait?: number;
      timeout?: number;
    },
  ): Promise<R>;
  override async $transaction<P extends Prisma.PrismaPromise<any>[], R>(
    arg: [...P] | ((prisma: Prisma.TransactionClient) => Promise<R>),
    options?:
      | {
          isolationLevel?: Prisma.TransactionIsolationLevel;
          maxWait?: number;
          timeout?: number;
        }
      | undefined,
  ): Promise<{ [K in keyof P]: Awaited<P[K]> } | R> {
    const context = this.getCurrentRlsContext();

    return this.withRlsTransactionScope(async () => {
      if (typeof arg === 'function') {
        return super.$transaction(
          async (tx) => {
            await tx.$executeRaw`
              SELECT app.set_rls_context(${context.userId}, ${context.role}, ${context.accessMode})
            `;

            return arg(tx);
          },
          options as never,
        ) as Promise<R>;
      }

      if (Array.isArray(arg)) {
        const results = await super.$transaction(
          [
            super.$executeRaw`
              SELECT app.set_rls_context(${context.userId}, ${context.role}, ${context.accessMode})
            `,
            ...arg,
          ] as Prisma.PrismaPromise<unknown>[],
          options as never,
        );

        return results.slice(1) as { [K in keyof P]: Awaited<P[K]> };
      }

      return super.$transaction(arg as never, options as never) as Promise<R>;
    });
  }

  private bindRlsDelegates() {
    for (const delegateKey of RLS_DELEGATE_KEYS) {
      Object.defineProperty(this, delegateKey, {
        configurable: true,
        get: () => (this.rlsClient as unknown as Record<string, unknown>)[delegateKey],
      });
    }
  }

  private createRlsClient() {
    const prismaService = this;

    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({
            args,
            query,
          }: {
            args: unknown;
            query: (queryArgs: unknown) => Prisma.PrismaPromise<unknown>;
          }) {
            if (prismaService.isRlsTransactionScoped()) {
              return query(args);
            }

            return prismaService.runQueryWithRlsContext(() => query(args));
          },
        },
      },
    }) as PrismaClient;
  }

  private getCurrentRlsContext() {
    return buildRlsContext(this.requestContext.get());
  }

  private isRlsTransactionScoped() {
    return this.requestContext.get()?.rlsTransactionScoped === true;
  }

  private async runQueryWithRlsContext<T>(queryFactory: () => Prisma.PrismaPromise<T>) {
    const context = this.getCurrentRlsContext();

    return this.withRlsTransactionScope(async () => {
      const [, result] = await super.$transaction([
        super.$executeRaw`
          SELECT app.set_rls_context(${context.userId}, ${context.role}, ${context.accessMode})
        `,
        queryFactory(),
      ]);

      return result as T;
    });
  }

  private async withRlsTransactionScope<T>(callback: () => Promise<T>) {
    const currentContext = this.requestContext.get();

    if (currentContext) {
      return this.requestContext.run(
        {
          ...currentContext,
          rlsTransactionScoped: true,
        },
        callback,
      );
    }

    return this.requestContext.run(
      {
        databaseAccessMode: 'internal',
        requestId: 'internal-prisma',
        rlsTransactionScoped: true,
      },
      callback,
    );
  }
}
