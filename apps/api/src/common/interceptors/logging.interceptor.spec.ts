/**
 * Purpose: Gate tests for the structured request log line.
 * Why important: A log line reporting Nest's default 201 for failed requests
 *   sent a whole diagnosis down the wrong path once; the error case is pinned
 *   here so it cannot regress.
 * Used by: apps/api unit test lane.
 */
import { BadRequestException, CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  const createExecutionContext = (request: Record<string, unknown>, responseOverrides = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          setHeader: jest.fn(),
          statusCode: 200,
          ...responseOverrides,
        }),
      }),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets response timing headers and logs the structured request event', async () => {
    const requestContext = {
      getRequestId: jest.fn().mockReturnValue('req_1'),
      set: jest.fn(),
    };
    const interceptor = new LoggingInterceptor(requestContext as never);
    const logger = {
      log: jest.fn(),
    };
    const response = {
      setHeader: jest.fn(),
      statusCode: 201,
    };

    (interceptor as any).logger = logger;
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1025);

    const result = interceptor.intercept(
      createExecutionContext(
        {
          method: 'POST',
          requestId: 'req_1',
          url: '/api/v1/listings',
          user: {
            id: 'user_1',
            role: 'USER',
          },
        },
        response,
      ),
      {
        handle: () => of({ accepted: true }),
      } as CallHandler,
    );

    await expect(lastValueFrom(result)).resolves.toEqual({ accepted: true });
    expect(requestContext.set).toHaveBeenCalledWith({
      databaseAccessMode: 'user',
      role: 'USER',
      userId: 'user_1',
    });
    expect(response.setHeader).toHaveBeenCalledWith('x-response-time-ms', '25');

    const payload = JSON.parse(logger.log.mock.calls[0][0] as string);

    expect(payload).toEqual({
      durationMs: 25,
      event: 'http.request',
      method: 'POST',
      path: '/api/v1/listings',
      requestId: 'req_1',
      statusCode: 201,
      userId: 'user_1',
    });
  });

  it('logs the exception status instead of the pre-handler default on errors', async () => {
    const interceptor = new LoggingInterceptor(undefined);
    const logger = { log: jest.fn() };
    // Nest sets a POST response to 201 before the handler runs; a validation
    // failure must not be logged as that phantom 201.
    const response = { setHeader: jest.fn(), statusCode: 201 };

    (interceptor as any).logger = logger;

    const result = interceptor.intercept(
      createExecutionContext(
        { method: 'POST', requestId: 'req_2', url: '/api/v1/listings' },
        response,
      ),
      {
        handle: () =>
          throwError(() => new BadRequestException({ message: 'Validation failed' })),
      } as CallHandler,
    );

    await expect(lastValueFrom(result)).rejects.toBeInstanceOf(BadRequestException);

    const payload = JSON.parse(logger.log.mock.calls[0][0] as string);

    expect(payload.statusCode).toBe(400);
  });

  it('logs 500 for non-HTTP exceptions', async () => {
    const interceptor = new LoggingInterceptor(undefined);
    const logger = { log: jest.fn() };
    const response = { setHeader: jest.fn(), statusCode: 200 };

    (interceptor as any).logger = logger;

    const result = interceptor.intercept(
      createExecutionContext({ method: 'GET', requestId: 'req_3', url: '/api/v1/x' }, response),
      {
        handle: () => throwError(() => new Error('db exploded')),
      } as CallHandler,
    );

    await expect(lastValueFrom(result)).rejects.toThrow('db exploded');

    const payload = JSON.parse(logger.log.mock.calls[0][0] as string);

    expect(payload.statusCode).toBe(500);
  });
});
