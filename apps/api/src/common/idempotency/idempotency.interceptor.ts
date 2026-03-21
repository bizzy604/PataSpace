import { createHash } from 'crypto';
import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { from, Observable, of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { IDEMPOTENCY_OPTIONS_KEY, IdempotencyOptions } from './idempotency.decorator';

type IdempotencyRecord = {
  body: unknown;
  fingerprint: string;
  statusCode: number;
};

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<IdempotencyOptions>(
      IDEMPOTENCY_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();
    const idempotencyKey = this.getIdempotencyKey(request, options);

    if (!idempotencyKey) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required for this endpoint',
      });
    }

    const fingerprint = this.createFingerprint(request.body);
    const cacheKey = this.buildCacheKey(request, idempotencyKey);
    const lockKey = `${cacheKey}:lock`;
    const ttlSeconds =
      options.ttlSeconds ??
      this.configService.get<number>('idempotency.ttlSeconds') ??
      86_400;
    const inProgressTtlSeconds =
      this.configService.get<number>('idempotency.inProgressTtlSeconds') ?? 120;

    return from(
      this.handleRequest({
        cacheKey,
        fingerprint,
        inProgressTtlSeconds,
        lockKey,
        next,
        options,
        response,
        ttlSeconds,
      }),
    );
  }

  private async handleRequest(params: {
    cacheKey: string;
    fingerprint: string;
    inProgressTtlSeconds: number;
    lockKey: string;
    next: CallHandler;
    options: IdempotencyOptions;
    response: { header: (name: string, value: string) => void; status: (code: number) => void; statusCode: number };
    ttlSeconds: number;
  }) {
    const existingRecord = await this.cacheService.get<IdempotencyRecord>(params.cacheKey);

    if (existingRecord) {
      if (existingRecord.fingerprint !== params.fingerprint) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'Idempotency-Key cannot be reused with a different payload',
        });
      }

      params.response.header('X-Idempotent', 'true');
      params.response.status(params.options.replayStatusCode ?? 200);

      return existingRecord.body;
    }

    const lockAcquired = await this.cacheService.setIfNotExists(
      params.lockKey,
      params.fingerprint,
      params.inProgressTtlSeconds,
    );

    if (!lockAcquired) {
      throw new ConflictException({
        code: 'REQUEST_ALREADY_IN_PROGRESS',
        message: 'A request with this Idempotency-Key is already being processed',
      });
    }

    try {
      const body = await lastValueFrom(params.next.handle());
      const statusCode = params.response.statusCode;

      if (statusCode >= 200 && statusCode < 300) {
        await this.cacheService.set(
          params.cacheKey,
          {
            body,
            fingerprint: params.fingerprint,
            statusCode,
          },
          params.ttlSeconds,
        );
      }

      return body;
    } finally {
      await this.cacheService.del(params.lockKey);
    }
  }

  private buildCacheKey(request: AuthenticatedRequest, idempotencyKey: string) {
    const routePath = `${request.method}:${request.route?.path ?? request.url}`;
    const userScope = request.user?.id ?? request.ip ?? 'anonymous';

    return `idempotency:${userScope}:${routePath}:${idempotencyKey}`;
  }

  private createFingerprint(payload: unknown) {
    return createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
  }

  private getIdempotencyKey(request: AuthenticatedRequest, options: IdempotencyOptions) {
    const headerValue = request.headers['idempotency-key'];

    if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
      return headerValue.trim();
    }

    return options.requireHeader === false ? null : null;
  }
}
