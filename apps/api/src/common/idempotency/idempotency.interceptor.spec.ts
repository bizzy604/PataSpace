import { createHash } from 'crypto';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { IdempotencyInterceptor } from './idempotency.interceptor';

describe('IdempotencyInterceptor', () => {
  const createExecutionContext = (request: Record<string, unknown>, responseOverrides = {}) =>
    ({
      getHandler: () => 'handler',
      getClass: () => class TestClass {},
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          header: jest.fn(),
          status: jest.fn(),
          statusCode: 201,
          ...responseOverrides,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('replays cached responses with X-Idempotent metadata', async () => {
    const response = {
      header: jest.fn(),
      status: jest.fn(),
      statusCode: 201,
    };
    const requestBody = { listingId: 'listing_1' };
    const cacheService = {
      get: jest.fn().mockResolvedValue({
        body: { id: 'unlock_1' },
        fingerprint: createHash('sha256').update(JSON.stringify(requestBody)).digest('hex'),
        statusCode: 201,
      }),
      setIfNotExists: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as CacheService;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({}),
    } as unknown as Reflector;
    const interceptor = new IdempotencyInterceptor(
      reflector,
      cacheService,
      {
        get: jest.fn().mockReturnValue(86400),
      } as never,
    );
    const context = createExecutionContext(
      {
        body: requestBody,
        headers: { 'idempotency-key': 'unlock_1' },
        ip: '127.0.0.1',
        method: 'POST',
        route: { path: '/unlocks' },
        url: '/unlocks',
      },
      response,
    );

    const result = interceptor.intercept(context, {
      handle: () => of({ id: 'new_unlock' }),
    } as CallHandler);

    await expect(lastValueFrom(result)).resolves.toEqual({ id: 'unlock_1' });
    expect(response.header).toHaveBeenCalledWith('X-Idempotent', 'true');
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('rejects requests already in progress for the same key', async () => {
    const cacheService = {
      get: jest.fn().mockResolvedValue(null),
      setIfNotExists: jest.fn().mockResolvedValue(false),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as CacheService;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({}),
    } as unknown as Reflector;
    const interceptor = new IdempotencyInterceptor(
      reflector,
      cacheService,
      {
        get: jest.fn().mockImplementation((key: string) =>
          key === 'idempotency.inProgressTtlSeconds' ? 60 : 86400,
        ),
      } as never,
    );
    const context = createExecutionContext({
      body: { listingId: 'listing_1' },
      headers: { 'idempotency-key': 'unlock_2' },
      ip: '127.0.0.1',
      method: 'POST',
      route: { path: '/unlocks' },
      url: '/unlocks',
    });

    const result = interceptor.intercept(context, {
      handle: () => of({ id: 'unlock_2' }),
    } as CallHandler);

    await expect(lastValueFrom(result)).rejects.toMatchObject({
      response: {
        code: 'REQUEST_ALREADY_IN_PROGRESS',
      },
    });
  });
});
