# PATASPACE API SPECIFICATION
## RESTful API Documentation | V1.0

---

# EXECUTIVE SUMMARY

**API Style:** REST (HTTP/JSON)  
**Base URL:** `https://api.pataspace.co.ke/api/v1`  
**Authentication:** JWT (Bearer tokens)  
**Rate Limiting:** 100 requests/minute per user  
**Versioning:** URI-based (`/api/v1/`)  

**Core Principles:**
- Resource-oriented design
- Consistent error responses
- Idempotent where appropriate
- Backward compatible changes only

---

## Implementation Alignment Note (2026-03-24)

- The canonical runtime prefix is `/api/v1`.
- Refresh tokens are returned and rotated in JSON payloads for the shipped backend surface; this spec no longer treats httpOnly cookies as canonical.
- Listing moderation and browse visibility stay on the listing record. Unlock, confirmation, dispute, refund, and commission progression live on related records.
- Repeat unlocks are idempotent: the API returns the existing unlock payload with `200 OK` and does not charge credits again.
- `GET /unlocks/my-unlocks` supports `pending_confirmation`, `confirmed`, `disputed`, and `refunded`.
- Disputes now include admin actions to investigate, resolve, and close.

---

# 1. API CONSUMERS & USE CASES

| Consumer | Platform | Primary Use Cases |
|----------|----------|-------------------|
| Mobile App | React Native (iOS + Android) | Post listings, browse, unlock, manage credits |
| Web App | Next.js | Browse listings, unlock, purchase credits |
| Admin Panel | React | Review listings, resolve disputes, analytics |
| Internal Services | NestJS | Cron jobs, background tasks |

---

# 2. AUTHENTICATION & AUTHORIZATION

## 2.1 Authentication Flow

```
┌─────────┐                                   ┌─────────┐
│ Client  │                                   │  Server │
└────┬────┘                                   └────┬────┘
     │                                              │
     │  POST /auth/register                         │
     │  { phone, password, firstName, lastName }    │
     ├─────────────────────────────────────────────►│
     │                                              │
     │  ◄─────────────────────────────────────────┤
     │  { userId, message: "OTP sent" }            │
     │                                              │
     │  POST /auth/verify-otp                       │
     │  { phone, code }                            │
     ├─────────────────────────────────────────────►│
     │                                              │
     │  ◄─────────────────────────────────────────┤
     │  { accessToken, refreshToken, user }        │
     │                                              │
     │  Subsequent requests                         │
     │  Authorization: Bearer <accessToken>         │
     ├─────────────────────────────────────────────►│
     │                                              │
```

---

## 2.2 JWT Token Structure

**Access Token (1 hour expiry):**
```json
{
  "sub": "user_clx123abc",
  "phone": "+254712345678",
  "role": "user",
  "iat": 1711000000,
  "exp": 1711003600
}
```

**Refresh Token (30 days expiry):**
- Returned in JSON response bodies
- Rotated on each use
- Stored by clients according to platform-specific security constraints

---

## 2.3 Authorization Headers

```http
GET /listings/my-listings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

# 3. API ENDPOINTS

## 3.1 AUTH ENDPOINTS

### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "phoneNumber": "+254712345678",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation:**
- `phoneNumber`: Valid Kenyan format (+254XXXXXXXXX)
- `password`: Min 8 chars, 1 uppercase, 1 number, 1 special
- `firstName/lastName`: 2-50 characters

**Response:** `201 Created`
```json
{
  "userId": "user_clx123abc",
  "message": "OTP sent to +254712345678",
  "expiresIn": 300
}
```

**Errors:**
- `400` - Validation error
- `409` - Phone number already registered
- `429` - Too many registration attempts (3/hour)

---

### POST /auth/verify-otp

Verify phone number with OTP code.

**Request:**
```json
{
  "phoneNumber": "+254712345678",
  "code": "123456"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_abc123...",
  "user": {
    "id": "user_clx123abc",
    "phoneNumber": "+254712345678",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "phoneVerified": true
  }
}
```

**Errors:**
- `400` - Invalid or expired OTP
- `429` - Too many attempts (3/hour)

---

### POST /auth/login

Login with phone and password.

**Request:**
```json
{
  "phoneNumber": "+254712345678",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_abc123...",
  "user": {
    "id": "user_clx123abc",
    "phoneNumber": "+254712345678",
    "firstName": "John",
    "role": "user"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account banned
- `429` - Too many login attempts (5/hour)

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_abc123..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_xyz789..."
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### POST /auth/logout

Invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## 3.2 LISTING ENDPOINTS

### POST /listings

Create a new listing (mobile only).

**Headers:** 
- `Authorization: Bearer <token>`
- `X-Device-Type: mobile` (required)

**Request:**
```json
{
  "county": "Nairobi",
  "neighborhood": "Kilimani",
  "address": "123 Argwings Kodhek Road, Apt 5B",
  "latitude": -1.289563,
  "longitude": 36.790942,
  "monthlyRent": 25000,
  "bedrooms": 2,
  "bathrooms": 1,
  "propertyType": "Apartment",
  "furnished": false,
  "description": "Spacious 2BR with balcony, great view of city",
  "amenities": ["Water 24/7", "Backup generator", "Parking"],
  "propertyNotes": "Landlord is very responsive, quiet neighborhood",
  "availableFrom": "2026-05-01T00:00:00Z",
  "availableTo": "2026-05-31T00:00:00Z",
  "photos": [
    {
      "url": "https://s3.amazonaws.com/pataspace/photo1.jpg",
      "s3Key": "listings/user_123/photo1.jpg",
      "order": 1,
      "latitude": -1.289563,
      "longitude": 36.790942,
      "takenAt": "2026-03-20T10:30:00Z"
    }
    // ... 9 more photos (min 5, max 15)
  ],
  "video": {
    "url": "https://s3.amazonaws.com/pataspace/video1.mp4",
    "s3Key": "listings/user_123/video1.mp4"
  }
}
```

**Validation:**
- `latitude/longitude`: Must be within Nairobi county bounds
- `monthlyRent`: 2,000 - 500,000 KES
- `bedrooms`: 0-10
- `photos`: Min 5, max 15 photos
- `video`: Required, max 50MB
- GPS coords in photos must match listing coords (±100m)

**Response:** `201 Created`
```json
{
  "id": "listing_clx456def",
  "status": "PENDING",
  "message": "Listing created. Awaiting admin review (first 3 listings).",
  "unlockCostCredits": 2500,
  "commission": 750,
  "estimatedApprovalTime": "24 hours"
}
```

**Errors:**
- `400` - Validation error (GPS mismatch, invalid data)
- `401` - Not authenticated
- `403` - Account not verified or banned
- `429` - Too many listings (10/day)

---

### GET /listings

Browse available listings with filters.

**Query Parameters:**
```
?county=Nairobi
&neighborhoods=Kilimani,Westlands,Lavington
&minRent=15000
&maxRent=30000
&bedrooms=2
&availableFrom=2026-04-01
&availableTo=2026-05-31
&furnished=true
&page=1
&limit=20
&sortBy=createdAt
&sortOrder=desc
```

**All parameters optional**

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "listing_clx456def",
      "county": "Nairobi",
      "neighborhood": "Kilimani",
      "monthlyRent": 25000,
      "bedrooms": 2,
      "bathrooms": 1,
      "propertyType": "Apartment",
      "furnished": false,
      "availableFrom": "2026-05-01T00:00:00Z",
      "unlockCostCredits": 2500,
      "thumbnailUrl": "https://cdn.pataspace.co.ke/photo1.jpg",
      "viewCount": 45,
      "unlockCount": 3,
      "isUnlocked": false,
      "createdAt": "2026-03-20T10:00:00Z",
      "tenant": {
        "firstName": "John",
        "joinedDate": "2026-01-15"
      }
    }
    // ... more listings
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Cache:** Redis, 5 minutes TTL

**Errors:**
- `400` - Invalid query parameters

---

### GET /listings/:id

Get full listing details.

**Headers:** `Authorization: Bearer <token>` (optional)

**Response:** `200 OK`
```json
{
  "id": "listing_clx456def",
  "county": "Nairobi",
  "neighborhood": "Kilimani",
  "monthlyRent": 25000,
  "bedrooms": 2,
  "bathrooms": 1,
  "propertyType": "Apartment",
  "furnished": false,
  "description": "Spacious 2BR with balcony...",
  "amenities": ["Water 24/7", "Backup generator", "Parking"],
  "propertyNotes": "Landlord is very responsive...",
  "availableFrom": "2026-05-01T00:00:00Z",
  "availableTo": "2026-05-31T00:00:00Z",
  "unlockCostCredits": 2500,
  "photos": [
    {
      "url": "https://cdn.pataspace.co.ke/photo1.jpg",
      "order": 1,
      "width": 1920,
      "height": 1080
    }
    // ... all photos
  ],
  "video": {
    "url": "https://cdn.pataspace.co.ke/video1.mp4"
  },
  "viewCount": 45,
  "unlockCount": 3,
  "isUnlocked": false,
  "createdAt": "2026-03-20T10:00:00Z",
  "tenant": {
    "firstName": "John",
    "joinedDate": "2026-01-15",
    "listingsPosted": 2
  },
  
  // Only if unlocked by current user:
  "contactInfo": {
    "address": "123 Argwings Kodhek Road, Apt 5B",
    "phoneNumber": "+254712345678",
    "latitude": -1.289563,
    "longitude": 36.790942
  }
}
```

**Errors:**
- `404` - Listing not found or deleted

---

### GET /listings/my-listings

Get current user's listings.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: `PENDING|ACTIVE|UNLOCKED|CONFIRMED|COMPLETED|DELETED|REJECTED` (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "listing_clx456def",
      "status": "active",
      "monthlyRent": 25000,
      "neighborhood": "Kilimani",
      "viewCount": 45,
      "unlockCount": 3,
      "totalEarnings": 2250,
      "pendingEarnings": 750,
      "createdAt": "2026-03-20T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### PATCH /listings/:id

Update listing (owner only).

**Headers:** `Authorization: Bearer <token>`

**Request (partial update):**
```json
{
  "description": "Updated description with new amenities",
  "availableTo": "2026-06-15T00:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "id": "listing_clx456def",
  "message": "Listing updated successfully",
  "updatedAt": "2026-03-21T14:30:00Z"
}
```

**Errors:**
- `403` - Not the listing owner
- `404` - Listing not found

---

### DELETE /listings/:id

Soft delete listing (owner only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Errors:**
- `403` - Not the listing owner
- `409` - Cannot delete listing with unresolved unlock activity

---

## 3.3 CREDIT ENDPOINTS

### GET /credits/balance

Get current credit balance.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "balance": 5000,
  "lifetimeEarned": 12000,
  "lifetimeSpent": 7000,
  "pendingCommissions": 1500
}
```

**Cache:** Redis, 5 minutes TTL

---

### POST /credits/purchase

Purchase credits via M-Pesa.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "package": "5_credits",
  "phoneNumber": "+254712345678"
}
```

**Package Options:**
- `5_credits`: 5,000 KES → 5,000 credits
- `10_credits`: 10,000 KES → 10,500 credits (5% bonus)
- `20_credits`: 20,000 KES → 22,000 credits (10% bonus)

**Response:** `202 Accepted`
```json
{
  "transactionId": "tx_clx789ghi",
  "status": "PENDING",
  "amount": 5000,
  "message": "M-Pesa prompt sent to +254712345678. Enter your PIN.",
  "estimatedCompletion": "30 seconds"
}
```

**Webhook (M-Pesa callback):**
```
POST /api/v1/payments/mpesa-callback
```

**Operational Note:** Pending purchases older than 5 minutes are reconciled by querying STK status so successful payments are not lost when callbacks arrive late or not at all.

**Errors:**
- `400` - Invalid phone number or package
- `402` - Previous transaction still pending
- `429` - Too many purchase attempts (10/day)
- `503` - M-Pesa service unavailable

---

### GET /credits/transactions

Get credit transaction history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type`: `purchase|spend|refund|bonus` (optional)
- `status`: `pending|completed|failed` (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "tx_clx789ghi",
      "type": "purchase",
      "amount": 5000,
      "balanceBefore": 2000,
      "balanceAfter": 7000,
      "status": "completed",
      "description": "Credit purchase - 5 credits package",
      "mpesaReceiptNumber": "NLJ7RT61SV",
      "createdAt": "2026-03-20T12:00:00Z"
    },
    {
      "id": "tx_clx890jkl",
      "type": "spend",
      "amount": -2500,
      "balanceBefore": 7000,
      "balanceAfter": 4500,
      "status": "completed",
      "description": "Unlocked listing in Kilimani",
      "unlockId": "unlock_clx999",
      "createdAt": "2026-03-20T14:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## 3.4 UNLOCK ENDPOINTS

### POST /unlocks

Unlock contact information for a listing.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "listingId": "listing_clx456def"
}
```

**Response:** `201 Created`
```json
{
  "unlockId": "unlock_clx999",
  "creditsSpent": 2500,
  "newBalance": 2500,
  "contactInfo": {
    "address": "123 Argwings Kodhek Road, Apt 5B",
    "phoneNumber": "+254712345678",
    "latitude": -1.289563,
    "longitude": 36.790942
  },
  "tenant": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+254712345678"
  },
  "message": "Contact unlocked. SMS sent to tenant to notify them."
}
```

**Idempotency:** If already unlocked, return same contact info without deducting credits again.

**Errors:**
- `200` - Already unlocked by this user; existing payload returned without charge
- `403` - Cannot unlock your own listing
- `402` - Insufficient credits
- `404` - Listing not found or deleted
- `410` - Listing no longer available (refund issued)

---

### GET /unlocks/my-unlocks

Get listings I've unlocked.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: `pending_confirmation|confirmed|disputed|refunded` (optional)
- `page`, `limit`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "unlockId": "unlock_clx999",
      "listing": {
        "id": "listing_clx456def",
        "neighborhood": "Kilimani",
        "monthlyRent": 25000,
        "bedrooms": 2
      },
      "creditsSpent": 2500,
      "contactInfo": {
        "phoneNumber": "+254712345678",
        "address": "123 Argwings Kodhek Road, Apt 5B"
      },
      "status": "pending_confirmation",
      "myConfirmation": null,
      "tenantConfirmation": null,
      "createdAt": "2026-03-20T14:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## 3.5 CONFIRMATION ENDPOINTS

### POST /confirmations

Confirm connection with other party.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "unlockId": "unlock_clx999",
  "side": "incoming_tenant"
}
```

**Side Options:**
- `outgoing_tenant`: Current tenant confirming
- `incoming_tenant`: New tenant confirming

**Response:** `201 Created`
```json
{
  "confirmationId": "confirm_clx111",
  "unlockId": "unlock_clx999",
  "side": "incoming_tenant",
  "confirmedAt": "2026-03-25T10:00:00Z",
  "bothConfirmed": false,
  "message": "Waiting for outgoing tenant to confirm."
}
```

**If both parties confirmed:**
```json
{
  "confirmationId": "confirm_clx111",
  "unlockId": "unlock_clx999",
  "side": "incoming_tenant",
  "confirmedAt": "2026-03-25T10:00:00Z",
  "bothConfirmed": true,
  "commission": {
    "amount": 750,
    "status": "PENDING",
    "payableOn": "2026-04-01T10:00:00Z"
  },
  "message": "Both parties confirmed! Commission will be paid on 2026-04-01."
}
```

**Errors:**
- `400` - Already confirmed
- `403` - Not authorized to confirm this unlock
- `404` - Unlock not found

---

## 3.6 DISPUTE ENDPOINTS

### POST /disputes

Report a dispute for an unlock.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "unlockId": "unlock_clx999",
  "reason": "Landlord rejected me without valid reason",
  "evidence": [
    "https://s3.amazonaws.com/evidence/screenshot1.jpg",
    "https://s3.amazonaws.com/evidence/screenshot2.jpg"
  ]
}
```

**Response:** `201 Created`
```json
{
  "disputeId": "dispute_clx222",
  "status": "OPEN",
  "message": "Dispute filed. Admin will review within 24 hours.",
  "estimatedResolution": "2-3 business days"
}
```

**Errors:**
- `400` - Already disputed
- `404` - Unlock not found

---

### GET /disputes/:id

Get dispute details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "dispute_clx222",
  "unlockId": "unlock_clx999",
  "reason": "Landlord rejected me without valid reason",
  "evidence": ["https://s3.amazonaws.com/evidence/screenshot1.jpg"],
  "status": "RESOLVED",
  "resolution": "Full refund issued. Landlord violated policy.",
  "resolvedAt": "2026-03-22T16:00:00Z",
  "refundAmount": 2500
}
```

### POST /disputes/:id/investigate

Move a dispute into `INVESTIGATING` (admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "id": "dispute_clx222",
  "unlockId": "unlock_clx999",
  "status": "INVESTIGATING",
  "reason": "Landlord rejected me without valid reason",
  "evidence": ["https://s3.amazonaws.com/evidence/screenshot1.jpg"],
  "createdAt": "2026-03-21T09:00:00Z"
}
```

### POST /disputes/:id/resolve

Resolve a dispute with or without refund (admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "action": "FULL_REFUND",
  "resolution": "Listing invalid. Full refund issued."
}
```

**Action Options:**
- `FULL_REFUND`
- `NO_REFUND`

**Response:** `200 OK`
```json
{
  "id": "dispute_clx222",
  "unlockId": "unlock_clx999",
  "status": "RESOLVED",
  "reason": "Landlord rejected me without valid reason",
  "resolution": "Listing invalid. Full refund issued.",
  "resolvedAt": "2026-03-22T16:00:00Z",
  "refundAmount": 2500
}
```

### POST /disputes/:id/close

Close a resolved dispute (admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "id": "dispute_clx222",
  "unlockId": "unlock_clx999",
  "status": "CLOSED",
  "reason": "Landlord rejected me without valid reason",
  "resolution": "Listing invalid. Full refund issued.",
  "resolvedAt": "2026-03-22T16:00:00Z",
  "refundAmount": 2500
}
```

---

## 3.7 UPLOAD ENDPOINTS

### POST /uploads/presigned-url

Get presigned S3 URL for direct upload.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "filename": "photo1.jpg",
  "contentType": "image/jpeg",
  "fileSize": 2048576
}
```

**Response:** `200 OK`
```json
{
  "uploadUrl": "https://s3.amazonaws.com/pataspace/...",
  "s3Key": "listings/user_123/1711000000-photo1.jpg",
  "expiresIn": 300
}
```

**Client then uploads directly to S3:**
```javascript
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: fileBlob
});
```

**Validation:**
- Max file size: 10MB (photos), 50MB (videos)
- Allowed types: `image/jpeg`, `image/png`, `video/mp4`

**Errors:**
- `400` - Invalid file type or size
- `429` - Too many upload requests (100/hour)

---

### POST /uploads/confirm

Confirm upload completion.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "s3Key": "listings/user_123/1711000000-photo1.jpg"
}
```

**Response:** `200 OK`
```json
{
  "url": "https://cdn.pataspace.co.ke/photo1.jpg",
  "cdnUrl": "https://cdn.pataspace.co.ke/photo1.jpg"
}
```

---

## 3.8 ADMIN ENDPOINTS

### GET /admin/listings/pending

Get listings awaiting review.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "listing_clx456def",
      "tenant": {
        "id": "user_clx123",
        "firstName": "John",
        "phoneNumber": "+254712345678",
        "listingsPosted": 1
      },
      "county": "Nairobi",
      "neighborhood": "Kilimani",
      "monthlyRent": 25000,
      "photos": [/* ... */],
      "createdAt": "2026-03-20T10:00:00Z",
      "daysWaiting": 1
    }
  ]
}
```

---

### POST /admin/listings/:id/approve

Approve a pending listing.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Response:** `200 OK`
```json
{
  "id": "listing_clx456def",
  "status": "active",
  "message": "Listing approved and now visible to all users"
}
```

---

### POST /admin/listings/:id/reject

Reject a listing.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Request:**
```json
{
  "reason": "Photos do not match GPS coordinates"
}
```

**Response:** `200 OK`
```json
{
  "id": "listing_clx456def",
  "status": "rejected",
  "message": "Listing rejected. User notified via SMS."
}
```

---

# 4. ERROR HANDLING

## 4.1 Standard Error Response

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You need 2,500 credits to unlock this listing. Current balance: 1,000.",
    "statusCode": 402,
    "details": {
      "required": 2500,
      "current": 1000,
      "shortfall": 1500
    },
    "timestamp": "2026-03-20T14:30:00Z",
    "path": "/api/v1/unlocks",
    "requestId": "req_xyz789"
  }
}
```

---

## 4.2 Error Codes

| HTTP Status | Error Code | Description | Retry? |
|-------------|------------|-------------|--------|
| 400 | `VALIDATION_ERROR` | Invalid request data | No |
| 401 | `UNAUTHORIZED` | Missing or invalid token | No |
| 402 | `INSUFFICIENT_CREDITS` | Not enough credits | No |
| 403 | `FORBIDDEN` | Not authorized for this action | No |
| 404 | `NOT_FOUND` | Resource not found | No |
| 409 | `CONFLICT` | Duplicate or conflicting request | No |
| 410 | `GONE` | Resource permanently deleted | No |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic error | No |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Yes (after delay) |
| 500 | `INTERNAL_SERVER_ERROR` | Server error | Yes |
| 502 | `BAD_GATEWAY` | External service error (M-Pesa) | Yes |
| 503 | `SERVICE_UNAVAILABLE` | Temporary unavailability | Yes |

---

## 4.3 Validation Error Details

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "statusCode": 400,
    "details": {
      "fields": {
        "phoneNumber": "Must be valid Kenyan format (+254XXXXXXXXX)",
        "monthlyRent": "Must be between 2,000 and 500,000"
      }
    }
  }
}
```

---

# 5. RATE LIMITING

## 5.1 Rate Limit Headers

Every response includes:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1711003600
```

When rate limit exceeded:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 45 seconds.",
    "statusCode": 429
  }
}
```

---

## 5.2 Per-Endpoint Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/register` | 3 | 1 hour |
| `POST /auth/login` | 5 | 1 hour |
| `POST /auth/verify-otp` | 3 | 1 hour |
| `POST /listings` | 10 | 24 hours |
| `POST /credits/purchase` | 10 | 24 hours |
| `POST /unlocks` | 50 | 24 hours |
| `GET *` | 100 | 1 minute |
| `POST *` (other) | 50 | 1 minute |

---

# 6. PAGINATION

## 6.1 Query Parameters

```
GET /listings?page=2&limit=20
```

**Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 20, max: 100)

---

## 6.2 Response Format

```json
{
  "data": [/* ... */],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

# 7. FILTERING & SORTING

## 7.1 Filter Parameters

```
GET /listings?county=Nairobi&minRent=15000&maxRent=30000&bedrooms=2
```

**Available Filters:**
- `county`: County name
- `neighborhoods`: Comma-separated list
- `minRent`, `maxRent`: Rent range (KES)
- `bedrooms`: Number of bedrooms
- `furnished`: `true|false`
- `availableFrom`: ISO date
- `availableTo`: ISO date

---

## 7.2 Sort Parameters

```
GET /listings?sortBy=monthlyRent&sortOrder=asc
```

**Sort Fields:**
- `createdAt` (default)
- `monthlyRent`
- `viewCount`
- `unlockCount`

**Sort Order:**
- `asc`
- `desc` (default)

---

# 8. WEBHOOKS

## 8.1 M-Pesa Payment Callback

**Endpoint:** `POST /api/v1/payments/mpesa-callback`

**Request (from Safaricom):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_191220221830000001",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 5000 },
          { "Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV" },
          { "Name": "TransactionDate", "Value": 20260320120000 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "ResultCode": 0,
  "ResultDesc": "Accepted"
}
```

**Internal Processing:**
1. Verify signature
2. Check idempotency (mpesaReceiptNumber)
3. Add credits to user balance (transaction)
4. Send SMS confirmation
5. WebSocket push (if connected)

---

# 9. VERSIONING & DEPRECATION

## 9.1 Versioning Strategy

**URI Versioning:**
- Current: `/v1/listings`
- Future: `/v2/listings`

**When to Bump Version:**
- Breaking changes to request/response schema
- Removal of endpoints
- Major behavior changes

**Non-Breaking Changes (no version bump):**
- Adding optional fields
- Adding new endpoints
- Adding query parameters

---

## 9.2 Deprecation Policy

**Notice Period:** 90 days minimum

**Deprecation Headers:**
```http
Sunset: Sat, 30 Jun 2026 23:59:59 GMT
Deprecation: true
Link: <https://docs.pataspace.co.ke/migration/v2>; rel="successor-version"
```

**Response Warning:**
```json
{
  "data": {/* ... */},
  "warning": {
    "code": "DEPRECATED",
    "message": "This endpoint will be removed on 2026-06-30. Migrate to /v2/listings.",
    "migrationGuide": "https://docs.pataspace.co.ke/migration/v2"
  }
}
```

---

# 10. SECURITY CONSIDERATIONS

## 10.1 Input Sanitization

**All inputs validated:**
- SQL injection: Prisma ORM prevents (parameterized queries)
- XSS: All output escaped
- CSRF: Not applicable (stateless JWT)

---

## 10.2 Sensitive Data Handling

**Never return in API responses:**
- Password hashes
- Full credit card numbers
- M-Pesa API credentials
- Admin tokens

**Encrypted fields:**
- `Listing.address` (until unlocked)
- `User.phoneNumber` (hashed for search)

---

## 10.3 CORS Configuration

```typescript
const corsOptions = {
  origin: [
    'https://pataspace.co.ke',
    'https://www.pataspace.co.ke',
    'https://admin.pataspace.co.ke',
    'http://localhost:3000',  // Dev only
  ],
  credentials: true,
  maxAge: 86400,  // 24 hours
};
```

---

# 11. PERFORMANCE & CACHING

## 11.1 Cache Headers

```http
# Static assets (photos, videos)
Cache-Control: public, max-age=31536000, immutable

# API responses (listing details)
Cache-Control: public, max-age=300, stale-while-revalidate=60

# User-specific data (credit balance)
Cache-Control: private, max-age=60
```

---

## 11.2 ETag Support

```http
GET /listings/listing_clx456def
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# If not modified:
HTTP/1.1 304 Not Modified
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

---

# 12. MONITORING & ANALYTICS

## 12.1 Request ID Tracking

Every request gets unique ID:
```http
X-Request-ID: req_clx999abc
```

Included in:
- Response headers
- Error responses
- Logs

**Client can include custom ID:**
```http
X-Client-Request-ID: mobile_abc123
```

---

## 12.2 Performance Headers

```http
X-Response-Time: 45ms
X-Cache-Status: HIT
X-DB-Query-Count: 3
X-DB-Query-Time: 12ms
```

---

# 13. IDEMPOTENCY

## 13.1 Idempotent Endpoints

**Naturally Idempotent:**
- `GET` (all)
- `PUT` (update with full resource)
- `DELETE` (soft delete)

**Idempotency Keys (for POST):**
```http
POST /unlocks
Idempotency-Key: unlock_clx456_user_clx123_20260320

# Second request with same key:
HTTP/1.1 200 OK (not 201)
X-Idempotent: true
```

**Implementation:**
```typescript
// Check if already processed
const existing = await redis.get(`idempotency:${key}`);
if (existing) {
  return JSON.parse(existing);
}

// Process request
const result = await processUnlock(data);

// Cache result (24 hours)
await redis.set(`idempotency:${key}`, JSON.stringify(result), 'EX', 86400);
```

---

# 14. TESTING & SANDBOX

## 14.1 Test Environment

**Base URL:** `https://api-sandbox.pataspace.co.ke/v1`

**Test Credentials:**
```
Phone: +254700000000
Password: TestPassword123!
OTP: 123456 (always works)
```

**M-Pesa Test Numbers:**
- Success: +254712345678
- Insufficient funds: +254700000001
- User cancels: +254700000002
- Timeout: +254700000003

---

## 14.2 Mock Responses

```http
GET /listings?mock=true

# Returns fixed mock data
```

---

# 15. API CLIENT EXAMPLES

## 15.1 JavaScript (Fetch)

```javascript
const API_BASE = 'https://api.pataspace.co.ke/api/v1';
let accessToken = localStorage.getItem('accessToken');

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  
  if (response.status === 401) {
    // Refresh token
    await refreshAccessToken();
    return apiCall(endpoint, options);
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}

// Usage
const listings = await apiCall('/listings?county=Nairobi');
```

---

## 15.2 TypeScript Types

```typescript
interface Listing {
  id: string;
  county: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  furnished: boolean;
  description: string;
  amenities: string[];
  availableFrom: string;
  unlockCostCredits: number;
  thumbnailUrl: string;
  isUnlocked: boolean;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

type ListingsResponse = PaginatedResponse<Listing>;
```

---

# 16. CHANGELOG & VERSIONING

## V1.0 (March 2026) - Initial Release

**Features:**
- User registration & authentication
- Listing creation (mobile only)
- Browse & filter listings
- Credit purchase (M-Pesa)
- Contact unlock system
- Confirmation flow
- Dispute management
- Admin review dashboard

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Next Review:** After MVP launch  
**API Status:** Development
