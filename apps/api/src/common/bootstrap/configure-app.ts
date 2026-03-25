import compression from 'compression';
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { resolveDatabaseAccessModeForPath } from '../database/rls-context.util';
import { RequestContextService } from '../request-context/request-context.service';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const requestContext = app.get(RequestContextService);
  const globalPrefix = configService.get<string>('http.globalPrefix') ?? 'api/v1';
  const requestIdHeader = configService.get<string>('http.requestIdHeader') ?? 'x-request-id';
  const allowedOrigins = configService.get<string[]>('http.allowedOrigins') ?? [];
  const trustProxy =
    configService.get<boolean | number | string | string[]>('http.trustProxy') ?? false;
  const httpAdapter = app.getHttpAdapter().getInstance() as {
    set: (name: string, value: boolean | number | string | string[]) => void;
  };

  httpAdapter.set('trust proxy', trustProxy);

  app.enableShutdownHooks();
  app.setGlobalPrefix(globalPrefix);
  app.use(
    (
      request: { headers: Record<string, string | string[] | undefined>; requestId?: string },
      response: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      const incomingRequestId = request.headers[requestIdHeader];
      const requestId =
        typeof incomingRequestId === 'string' && incomingRequestId.trim().length > 0
          ? incomingRequestId
          : randomUUID();

      request.requestId = requestId;
      response.setHeader(requestIdHeader, requestId);
      const requestPath =
        (request as { originalUrl?: string }).originalUrl ??
        (request as { url?: string }).url;

      requestContext.run(
        {
          databaseAccessMode: resolveDatabaseAccessModeForPath(requestPath),
          requestId,
          method: (request as { method?: string }).method,
          path: requestPath,
        },
        next,
      );
    },
  );
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: false,
  });
  app.use(helmet());
  app.use(compression());
  app.useGlobalFilters(new AllExceptionsFilter(requestIdHeader, requestContext));
  app.useGlobalInterceptors(new LoggingInterceptor(requestContext));

  return {
    globalPrefix,
  };
}
