import compression from 'compression';
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { RequestContextService } from '../request-context/request-context.service';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const requestContext = app.get(RequestContextService);
  const globalPrefix = configService.get<string>('http.globalPrefix') ?? 'api/v1';
  const requestIdHeader = configService.get<string>('http.requestIdHeader') ?? 'x-request-id';
  const allowedOrigins = configService.get<string[]>('http.allowedOrigins') ?? [];

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
      requestContext.run(
        {
          requestId,
          method: (request as { method?: string }).method,
          path:
            (request as { originalUrl?: string }).originalUrl ??
            (request as { url?: string }).url,
        },
        next,
      );
    },
  );
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
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
