/**
 * Purpose: Strip the query string from a request URL before it is logged or
 *   echoed in an error response, so secrets passed as query params never land
 *   in logs (e.g. the M-Pesa callback `?token=<shared-secret>` form).
 * Why important: The request logger and exception filter record the request
 *   path; without this the callback secret would be persisted to application
 *   logs and reflected in error-response bodies.
 * Used by: LoggingInterceptor, AllExceptionsFilter.
 */
export function sanitizeLogPath(url: string | undefined | null): string {
  if (!url) {
    return '';
  }

  const queryIndex = url.indexOf('?');
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}
