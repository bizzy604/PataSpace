import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request.requestId ?? request.headers['x-request-id'];

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.normalizePayload(exception, status);

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
        };
      }

      if (typeof payload === 'object' && payload !== null) {
        const typedPayload = payload as Record<string, unknown>;

        return {
          code: this.asString(typedPayload.code) ?? this.defaultCode(status),
          message: this.asMessage(typedPayload.message) ?? 'Request failed',
          details: typedPayload.details ?? null,
        };
      }
    }

    return {
      code: this.defaultCode(status),
      message: 'Internal server error',
      details: null,
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
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
