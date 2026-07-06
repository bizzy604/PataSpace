/**
 * Purpose: Structured per-request log line (method, path, status, duration).
 * Why important: This line is the primary trace for diagnosing API behaviour;
 *   it must report the real outcome, including on thrown exceptions.
 * Used by: Global interceptor chain (app.module).
 */
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { resolveDatabaseAccessModeForRole } from '../database/rls-context.util';
import { sanitizeLogPath } from '../http/sanitize-log-path.util';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly requestContext?: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startedAt = Date.now();
    const requestId = request.requestId ?? this.requestContext?.getRequestId() ?? 'unknown';

    if (request.user) {
      this.requestContext?.set({
        databaseAccessMode: resolveDatabaseAccessModeForRole(request.user.role),
        userId: request.user.id,
        role: request.user.role,
      });
    }

    // On the error path response.statusCode still holds Nest's pre-handler
    // default (201 for POST) because the exception filter runs after this
    // interceptor unwinds — capture the real status from the exception.
    let errorStatusCode: number | null = null;

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          errorStatusCode = error instanceof HttpException ? error.getStatus() : 500;
        },
      }),
      finalize(() => {
        const duration = Date.now() - startedAt;
        response.setHeader('x-response-time-ms', String(duration));

        this.logger.log(
          JSON.stringify({
            event: 'http.request',
            method: request.method,
            path: sanitizeLogPath(request.url),
            statusCode: errorStatusCode ?? response.statusCode,
            durationMs: duration,
            requestId,
            userId: request.user?.id ?? null,
          }),
        );
      }),
    );
  }
}
