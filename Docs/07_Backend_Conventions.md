# Backend Conventions ADR

- Status: Accepted
- Date: 2026-03-21
- Scope: `apps/api`, `packages/contracts`, and backend-facing client integrations

## Decisions

### API Base Path

- The canonical backend prefix is `/api/v1`.
- Reverse proxy, local smoke tests, client helpers, and future docs updates must align to `/api/v1`.

### Validation Ownership

- Shared Zod contracts in `packages/contracts` are the request and response source of truth.
- Nest handlers may use thin route-local pipes or adapters around those shared schemas, but the schema definitions must not drift into separately maintained DTO contracts.

### Refresh Token Transport

- MVP refresh tokens are returned in JSON and rotated on every refresh.
- Web and mobile clients must store refresh tokens using their platform-appropriate secure storage strategy.
- This keeps transport consistent across mobile, web, and admin clients while the backend is still a modular monolith.

### Unlock Idempotency

- Repeating the same unlock for the same listing and buyer returns the existing unlock payload.
- A successful unlock must never deduct credits twice.
- Payment callbacks and unlock creation both require central idempotency handling.

### Listing Lifecycle

- Listing browse visibility is governed by listing moderation and soft-delete state.
- Unlock, confirmation, and commission progression belongs to unlock, confirmation, dispute, and commission records.
- Listing state must not be overloaded in a way that removes active listings from browse results after unlock or confirmation.

### Error Envelope

- Error responses must use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "statusCode": 400,
    "details": {}
  },
  "meta": {
    "requestId": "req_123",
    "path": "/api/v1/listings",
    "timestamp": "2026-03-21T12:00:00.000Z"
  }
}
```

### PII Storage

- Sensitive user and listing contact data must use application-level authenticated encryption.
- Phone lookup must be separated from the encrypted display value so equality lookup does not require storing plaintext.
- Listing address and revealed unlock contact data stay encrypted at rest and are only decrypted for authorized flows.

### MVP Economics

- Unlock cost is 10 percent of monthly rent.
- Commission is fixed at 30 percent of unlock cost.
- Any stale 30-40 percent wording in downstream docs or schema comments should be treated as obsolete.
