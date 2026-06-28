import { sanitizeLogPath } from './sanitize-log-path.util';

describe('sanitizeLogPath', () => {
  it('strips a query string that could carry a callback secret', () => {
    expect(sanitizeLogPath('/api/v1/payments/mpesa-callback?token=s3cret')).toBe(
      '/api/v1/payments/mpesa-callback',
    );
  });

  it('leaves a query-less path untouched', () => {
    expect(sanitizeLogPath('/api/v1/unlocks/received')).toBe('/api/v1/unlocks/received');
  });

  it('drops everything after the first question mark', () => {
    expect(sanitizeLogPath('/path?a=1?b=2')).toBe('/path');
  });

  it('returns an empty string for null or undefined input', () => {
    expect(sanitizeLogPath(undefined)).toBe('');
    expect(sanitizeLogPath(null)).toBe('');
  });
});
