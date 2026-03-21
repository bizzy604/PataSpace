import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RequestContextService } from '../request-context/request-context.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly requestIdHeader = 'x-request-id',
    private readonly requestContext?: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId =
      request.requestId ??
      request.headers[this.requestIdHeader] ??
      this.requestContext?.getRequestId();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.normalizePayload(exception, status);
    const retryAfter = payload.retryAfter ?? this.extractRetryAfter(payload.details);

    if (requestId) {
      response.setHeader(this.requestIdHeader, requestId);
    }

    if (retryAfter !== null) {
      response.setHeader('Retry-After', String(retryAfter));
    }

    response.status(status).json({
      error: {
        code: payload.code,
        message: payload.message,
        statusCode: status,
        details: payload.details,
      },
      meta: {
        path: request.url,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private normalizePayload(exception: unknown, status: number) {
    if (exception instanceof BadRequestException) {
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null) {
        const typedPayload = payload as Record<string, unknown>;

        return {
          code: this.asString(typedPayload.code) ?? 'VALIDATION_ERROR',
          message: this.asMessage(typedPayload.message) ?? 'Validation failed',
          details: typedPayload.details ?? typedPayload,
          retryAfter: this.asNumber(typedPayload.retryAfter),
        };
      }
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return {
          code: this.defaultCode(status),
          message: payload,
          details: null,
          retryAfter: null,
        };
      }

      if (typeof payload === 'object' && payload !== null) {
        const typedPayload = payload as Record<string, unknown>;

        return {
          code: this.asString(typedPayload.code) ?? this.defaultCode(status),
          message: this.asMessage(typedPayload.message) ?? 'Request failed',
          details: typedPayload.details ?? null,
          retryAfter: this.asNumber(typedPayload.retryAfter),
        };
      }
    }

    return {
      code: this.defaultCode(status),
      message: 'Internal server error',
      details: null,
      retryAfter: null,
    };
  }

  private asMessage(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return null;
  }

  private asString(value: unknown) {
    return typeof value === 'string' ? value : null;
  }

  private asNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private extractRetryAfter(value: unknown) {
    if (typeof value !== 'object' || value === null) {
      return null;
    }

    return this.asNumber((value as Record<string, unknown>).retryAfter);
  }

  private defaultCode(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
