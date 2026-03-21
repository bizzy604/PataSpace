import compression from 'compression';
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
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
      next();
    },
  );
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: false,
  });
  app.use(helmet());
  app.use(compression());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  return {
    globalPrefix,
  };
}
