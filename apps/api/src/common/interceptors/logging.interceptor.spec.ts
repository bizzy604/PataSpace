import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
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
});
