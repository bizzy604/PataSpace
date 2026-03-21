import { createHash } from 'crypto';

export function createStrongEtag(payload: unknown) {
  const serializedPayload = JSON.stringify(payload);
  const digest = createHash('sha1').update(serializedPayload).digest('hex');

  return `"${digest}"`;
}

export function matchesIfNoneMatch(
  headerValue: string | string[] | undefined,
  etag: string,
) {
  if (!headerValue) {
    return false;
  }

  const values = Array.isArray(headerValue)
    ? headerValue
    : headerValue.split(',').map((entry) => entry.trim());

  return values.includes('*') || values.includes(etag);
}
