import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
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
        userId: request.user.id,
        role: request.user.role,
      });
    }

    return next.handle().pipe(
      finalize(() => {
        const duration = Date.now() - startedAt;
        response.setHeader('x-response-time-ms', String(duration));

        this.logger.log(
          JSON.stringify({
            event: 'http.request',
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            durationMs: duration,
            requestId,
            userId: request.user?.id ?? null,
          }),
        );
      }),
    );
  }
}
