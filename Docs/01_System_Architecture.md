# PATASPACE SYSTEM ARCHITECTURE
## Production-Grade System Design | V1.0 MVP

---

# EXECUTIVE SUMMARY

**System:** PataSpace - Tenant-to-tenant housing marketplace platform  
**Architecture:** Monolithic backend with mobile + web clients  
**Scale Target:** 10,000 users, 2,000 listings, 500 transactions/month (MVP)  
**Timeline:** 90 days to production  
**Primary Design Goal:** Build for clarity and simplicity, plan for scale  

---

# 1. REQUIREMENTS SUMMARY

## 1.1 Functional Requirements

### Core Workflows
1. **Outgoing Tenant:** Post apartment (mobile only, GPS + camera required)
2. **Incoming Tenant:** Browse listings, buy credits, unlock contact
3. **Confirmation:** Both parties confirm connection
4. **Commission:** Pay outgoing tenant via M-Pesa after confirmation
5. **Admin:** Review listings, resolve disputes

### Key Features
- Real-time photo/video capture with GPS embedding (mobile)
- Credit-based unlock system (10% of rent)
- M-Pesa payments (STK Push for credits, B2C for commissions)
- SMS notifications (Africa's Talking)
- Refund system (if landlord rejects)
- Admin review dashboard

## 1.2 Non-Functional Requirements

| Requirement | Target | Maximum |
|-------------|--------|---------|
| API Latency (p95) | <300ms | 500ms |
| Page Load | <2s | 3s |
| Uptime | 99.5% | - |
| Concurrent Users | 500 | 1,000 |
| Database Capacity | 100K records | - |
| Image Storage | 10GB/month | - |

### Consistency Requirements
- **Strong Consistency:** Credit transactions, commission calculations
- **Eventual Consistency:** Listing views, notifications (acceptable)

### Security Requirements
- TLS 1.3 for all traffic
- JWT authentication (1hr access, 30d refresh)
- PII encryption at rest
- M-Pesa webhook signature verification
- Rate limiting (100 req/min per user)

---

# 2. CAPACITY ESTIMATION

## 2.1 Traffic Estimates

**Month 3 (MVP Target):**
- **Total Users:** 2,000
- **Daily Active Users (DAU):** 400 (20%)
- **Outgoing Tenants:** 200 (posting listings)
- **Incoming Tenants:** 1,800 (browsing)

**Daily Requests:**
```
Listing Views: 1,500 (browsing)
API Calls: 3,000 (filters, search, details)
Photo Uploads: 100 (5 photos × 20 new listings)
Credit Purchases: 20
Unlocks: 15
Total: ~4,700 requests/day

Peak QPS: 4,700 / (12 hours × 3,600) ≈ 0.1 QPS
With 10x headroom: 1 QPS (easily handled by single server)
```

## 2.2 Storage Estimates

**Data Storage:**
```
Users: 2,000 × 2KB = 4MB
Listings: 2,000 × 5KB = 10MB
Transactions: 500 × 1KB = 0.5MB
Total: ~15MB (negligible)
```

**Media Storage:**
```
Photos per listing: 10 (avg)
Photo size: 500KB (compressed)
Total listings: 2,000
Photos: 2,000 × 10 × 500KB = 10GB

Videos per listing: 1
Video size: 5MB (compressed)
Videos: 2,000 × 5MB = 10GB

Total Media: 20GB (Month 3)
Growth: 5GB/month
```

**Bandwidth:**
```
Photo views: 1,500 views/day × 10 photos × 500KB = 7.5GB/day
Video views: 300 views/day × 5MB = 1.5GB/day
Uploads: 100 photos/day × 500KB = 50MB/day
Total: ~9GB/day (270GB/month)

With CDN: $5-10/month
```

## 2.3 Cost Estimate (MVP)

| Component | Cost/Month |
|-----------|------------|
| DigitalOcean Droplet (4GB) | $24 |
| PostgreSQL Managed DB | $15 |
| S3 Storage (20GB) | $0.50 |
| Cloudflare CDN (270GB) | $0 (free tier) |
| M-Pesa API | Free (pay per transaction) |
| Africa's Talking SMS | $10 (1,000 SMS) |
| **Total** | **~$50/month** |

**Verdict:** Single server can easily handle MVP scale. No complex infrastructure needed.

---

# 3. HIGH-LEVEL ARCHITECTURE

## 3.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │ Mobile App   │   │ Web App      │   │ Admin Panel  │   │
│  │ React Native │   │ Next.js      │   │ React        │   │
│  │              │   │              │   │              │   │
│  │ - Post       │   │ - Browse     │   │ - Review     │   │
│  │ - Camera     │   │ - Unlock     │   │ - Disputes   │   │
│  │ - GPS        │   │ - Credits    │   │ - Analytics  │   │
│  └──────────────┘   └──────────────┘   └──────────────┘   │
│         │                  │                    │           │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
          └──────────────────┼────────────────────┘
                             │ HTTPS (TLS 1.3)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│         NGINX (Reverse Proxy + Rate Limiting)                │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        NestJS Backend (Node.js 20)                    │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Modules (Clean Architecture)                   │ │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌────────────┐      │ │  │
│  │  │  │  Auth   │  │ Listing │  │   Credit   │      │ │  │
│  │  │  │ Module  │  │ Module  │  │   Module   │      │ │  │
│  │  │  └─────────┘  └─────────┘  └────────────┘      │ │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌────────────┐      │ │  │
│  │  │  │ Payment │  │ Upload  │  │   Admin    │      │ │  │
│  │  │  │ Module  │  │ Module  │  │   Module   │      │ │  │
│  │  │  └─────────┘  └─────────┘  └────────────┘      │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │                  │                    │
          ├──────────────────┼────────────────────┤
          ▼                  ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │   │   AWS S3     │
│   (Primary   │   │   (Cache +   │   │   (Photos    │
│   Database)  │   │    Queue)    │   │   + Videos)  │
└──────────────┘   └──────────────┘   └──────────────┘
          │
          └──────────────────────────────────────┐
          ▼                                      ▼
┌──────────────────┐              ┌──────────────────┐
│  M-Pesa Daraja   │              │ Africa's Talking │
│  (Payments)      │              │     (SMS)        │
│  - STK Push      │              │  - OTP           │
│  - B2C           │              │  - Notifications │
└──────────────────┘              └──────────────────┘
```

## 3.2 Design Decisions & Trade-offs

### Decision 1: Monolithic Backend (Not Microservices)

**Choice:** Single NestJS application with modular architecture

**Rationale:**
- MVP scale: 0.1-1 QPS (single server handles easily)
- Team size: 2-3 developers (microservices add complexity)
- Development speed: 90-day timeline (monolith is faster)
- Data consistency: Strong consistency needed for credits (easier in monolith)

**Trade-offs:**
- ✅ PRO: Simple deployment, easy debugging, fast development
- ✅ PRO: Strong consistency (ACID transactions)
- ❌ CON: Cannot scale individual modules independently
- ❌ CON: Must deploy entire app for any change

**When to Revisit:**
- Users >50,000
- QPS >100
- Team >10 engineers

---

### Decision 2: PostgreSQL (Not NoSQL)

**Choice:** PostgreSQL 15 as primary database

**Rationale:**
- Transactional integrity: Credit purchases, commission calculations MUST be ACID
- Complex queries: Filtering listings by multiple criteria (location, rent, date)
- Data structure: Well-defined schema, relationships are clear
- Prisma ORM: Excellent TypeScript support

**Trade-offs:**
- ✅ PRO: ACID compliance (critical for money)
- ✅ PRO: Rich querying (filters, full-text search)
- ✅ PRO: Proven reliability
- ❌ CON: Vertical scaling only (but not needed at MVP scale)

**Alternatives Considered:**
- MongoDB: Rejected (need ACID for credits)
- DynamoDB: Rejected (overkill for MVP, expensive)

---

### Decision 3: S3 for Media (Not Database BLOBs)

**Choice:** AWS S3 for photos/videos

**Rationale:**
- Storage cost: $0.023/GB vs $0.10+/GB for DB
- Scalability: Unlimited storage
- CDN integration: Cloudflare caches S3 objects
- Database size: Keep DB small and fast

**Trade-offs:**
- ✅ PRO: Cheap ($0.50/month for 20GB)
- ✅ PRO: Fast CDN delivery
- ✅ PRO: Easy to scale
- ❌ CON: Additional service to manage
- ❌ CON: Eventual consistency (acceptable for images)

---

### Decision 4: Server-Side Rendering for Web (Next.js)

**Choice:** Next.js with SSR for listing pages

**Rationale:**
- SEO: Listings should be indexable by Google
- Performance: First paint <2s for incoming tenants
- Developer experience: React + TypeScript

**Trade-offs:**
- ✅ PRO: Great SEO (organic traffic)
- ✅ PRO: Fast initial load
- ❌ CON: Slightly more complex than SPA

---

### Decision 5: React Native for Mobile (Not Native)

**Choice:** React Native + Expo for mobile app

**Rationale:**
- Timeline: 90 days (single codebase for iOS + Android)
- Camera/GPS: expo-camera + expo-location work well
- Team: JavaScript/TypeScript developers available
- Posting is mobile-only: Need camera + GPS access

**Trade-offs:**
- ✅ PRO: Write once, deploy iOS + Android
- ✅ PRO: Fast development
- ✅ PRO: Easy to hire React developers
- ❌ CON: Slightly larger app size than native
- ❌ CON: Some performance overhead (acceptable for our use case)

---

# 4. DATA FLOW DIAGRAMS

## 4.1 Critical Flow: Posting Listing (Mobile)

```
┌──────────┐
│  Mobile  │
│   App    │
└─────┬────┘
      │ 1. Open camera
      ▼
┌──────────────┐
│ Take 10      │
│ Photos       │──────┐ GPS coords embedded
└──────────────┘      │ in EXIF metadata
                      │
      │ 2. Record video
      ▼
┌──────────────┐
│ Upload to    │
│ S3 (direct)  │──────┐ Presigned URL
└──────────────┘      │ from backend
                      │
      │ 3. POST /api/listings
      ▼
┌──────────────────────────────┐
│ NestJS Backend               │
│ ┌──────────────────────────┐ │
│ │ 1. Validate GPS coords   │ │
│ │ 2. Check user quota      │ │
│ │ 3. Create listing record │ │──▶ PostgreSQL
│ │ 4. Set status: 'pending' │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
      │
      ▼
┌──────────────────┐
│ Admin Review     │
│ (if first 3)     │
└──────────────────┘
      │ Approved
      ▼
┌──────────────────┐
│ Status: 'active' │──▶ Visible to all
└──────────────────┘
```

**Key Constraints:**
- Photos MUST have GPS coordinates (validation)
- First 3 listings require manual review (fraud prevention)
- S3 upload uses presigned URLs (security)
- Total time: <30 seconds (user experience)

---

## 4.2 Critical Flow: Unlock Contact

```
┌──────────┐
│ Web App  │
└─────┬────┘
      │ 1. Browse listings (free)
      ▼
┌──────────────────┐
│ View all photos  │──▶ Served from CDN
│ + video          │    (fast, cheap)
└──────────────────┘
      │
      │ 2. Click "Unlock Contact"
      ▼
┌───────────────────────────────┐
│ Check credit balance          │──▶ Redis cache
└───────────────────────────────┘    (fast read)
      │
      │ Sufficient credits?
      ▼ YES
┌─────────────────────────────────────────┐
│ NestJS Backend (TRANSACTION)            │
│ ┌─────────────────────────────────────┐ │
│ │ BEGIN TRANSACTION                   │ │
│ │ 1. Deduct credits from balance      │ │
│ │ 2. Create unlock record             │ │
│ │ 3. Update listing.unlock_count      │ │
│ │ COMMIT                              │ │──▶ PostgreSQL
│ └─────────────────────────────────────┘ │    (ACID)
└─────────────────────────────────────────┘
      │
      ├──▶ Invalidate cache (Redis)
      │
      ├──▶ Queue SMS job (Redis Bull)
      │
      └──▶ Return contact info
            ▼
      ┌────────────────┐
      │ Display:       │
      │ - Address      │
      │ - Phone        │
      │ - GPS coords   │
      └────────────────┘
```

**Key Constraints:**
- MUST use database transaction (ensure atomicity)
- Balance check + deduction MUST be atomic (prevent double-spend)
- Contact reveal is irreversible (cannot "un-unlock")
- SMS sent asynchronously (don't block response)

**Failure Modes:**
- Insufficient credits: Return 402 error, prompt to buy
- Listing deleted: Return 410 error, full refund
- Database failure: Rollback transaction, retry

---

## 4.3 Critical Flow: Credit Purchase (M-Pesa)

```
┌──────────┐
│ Web/App  │
└─────┬────┘
      │ 1. POST /api/credits/purchase
      │    {package: "5_credits", phone: "+254..."}
      ▼
┌─────────────────────────────────────────┐
│ NestJS Backend                          │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Validate phone number            │ │
│ │ 2. Create pending transaction       │ │──▶ PostgreSQL
│ │ 3. Call M-Pesa STK Push API         │ │
│ └─────────────────────────────────────┘ │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│ M-Pesa Daraja API       │
│ (Safaricom)             │
└────────┬────────────────┘
         │ 2. Send prompt to user's phone
         ▼
┌────────────────┐
│ User's Phone   │
│ "Enter PIN"    │──▶ User enters M-Pesa PIN
└────────────────┘
         │ 3. Payment processed (10-30s)
         ▼
┌─────────────────────────────────────────┐
│ M-Pesa Callback                         │
│ POST /api/payments/mpesa-callback       │
│ {                                       │
│   TransactionID: "NLJ7RT61SV",          │
│   Amount: 5000,                         │
│   PhoneNumber: "+254...",               │
│   ResultCode: 0  // Success             │
│ }                                       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ NestJS Backend (TRANSACTION)            │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Verify callback signature        │ │
│ │ 2. BEGIN TRANSACTION                │ │
│ │ 3. Add credits to balance           │ │
│ │ 4. Update transaction status: paid  │ │
│ │ 5. COMMIT                           │ │──▶ PostgreSQL
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │
         ├──▶ Invalidate cache (Redis)
         │
         ├──▶ Queue success SMS
         │
         └──▶ WebSocket push (if connected)
               ▼
         ┌────────────────┐
         │ User sees      │
         │ "5 credits     │
         │  added!"       │
         └────────────────┘
```

**Key Constraints:**
- Callback signature MUST be verified (security)
- Idempotency: Same TransactionID should not add credits twice
- Timeout: If no callback in 60s, mark as "pending" for manual review
- Retry: M-Pesa API can fail, need retry logic (3 attempts)

**Failure Modes:**
- User cancels: Callback with ResultCode != 0, update status to "cancelled"
- Insufficient funds: Callback error, notify user
- Network timeout: Retry callback webhook registration
- Duplicate transaction: Check TransactionID, return early

---

## 4.5 Critical Flow: Commission Payout

```
┌─────────────────────────┐
│ Cron Job (Daily 9 AM)   │──▶ Scheduled task
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Fetch commissions due                   │
│ WHERE:                                  │
│   - both parties confirmed              │
│   - 7 days passed                       │
│   - status = 'pending'                  │
└────────┬────────────────────────────────┘
         │
         ▼ (batch of 50)
┌─────────────────────────────────────────┐
│ For each commission:                    │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Call M-Pesa B2C API              │ │
│ │ 2. Wait for response (1-5 min)      │ │
│ │ 3. Update status: 'paid'            │ │──▶ PostgreSQL
│ │ 4. Send SMS confirmation            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │
         ▼
┌────────────────────┐
│ Outgoing Tenant    │
│ receives M-Pesa    │
│ "You received      │
│  450 KES from      │
│  PataSpace"        │
└────────────────────┘
```

**Key Constraints:**
- Batch size: 50 commissions max per run (M-Pesa rate limit)
- Retry: If B2C fails, retry 3 times with exponential backoff
- Manual fallback: After 3 failures, flag for manual processing
- Audit trail: Log every payout attempt

---

# 5. DETAILED COMPONENT DESIGN

## 5.1 Authentication Service

**Responsibility:** User registration, login, token management

**APIs:**
- `POST /auth/register` - Create account + send OTP
- `POST /auth/verify-otp` - Verify phone number
- `POST /auth/login` - Login with phone + password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token

**Key Design:**
```typescript
// JWT Payload
interface JWTPayload {
  sub: string;        // User ID
  phone: string;      // Phone number
  role: 'user' | 'admin';
  iat: number;        // Issued at
  exp: number;        // Expires at
}

// Access token: 1 hour expiry
// Refresh token: 30 days, stored in httpOnly cookie
```

**Security:**
- Password: bcrypt with 12 rounds
- OTP: 6 digits, 5-minute expiry, max 3 attempts/hour
- Rate limiting: 5 login attempts per hour per IP

**Scaling Strategy:**
- Stateless (JWT) - horizontal scaling works
- OTP codes in Redis (TTL: 5 minutes)
- Refresh tokens in PostgreSQL (indexed by user_id)

---

## 5.2 Listing Service

**Responsibility:** Create, read, update listings

**APIs:**
- `POST /listings` - Create listing (mobile only)
- `GET /listings` - Browse listings (with filters)
- `GET /listings/:id` - Get listing details
- `PATCH /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing

**Key Design:**
```typescript
// Filter query
interface ListingFilter {
  county?: string;
  neighborhoods?: string[];
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  availableFrom?: Date;
  availableTo?: Date;
}

// Response
interface ListingResponse {
  id: string;
  neighborhood: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  availableDate: Date;
  photos: string[];      // S3 URLs
  video: string;         // S3 URL
  unlockCost: number;    // Credits
  isUnlocked: boolean;   // For current user
}
```

**Performance:**
- Cache listing details in Redis (TTL: 1 hour)
- Index: (county, neighborhood, rent, availableDate)
- Photos served via CDN (Cloudflare)
- Pagination: 20 listings per page

**Scaling Strategy:**
- Read replicas for browse queries
- Write primary for create/update
- Full-text search: PostgreSQL ts_vector

---

## 5.3 Credit Service

**Responsibility:** Manage user credit balance

**APIs:**
- `GET /credits/balance` - Get current balance
- `POST /credits/purchase` - Buy credits (M-Pesa)
- `GET /credits/transactions` - Transaction history

**Key Design:**
```typescript
// Balance is CRITICAL - must be accurate
// Use database transactions for all operations

async spendCredits(userId: string, amount: number) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Lock user's credit record (SELECT FOR UPDATE)
    const credit = await tx.credit.findUnique({
      where: { userId },
      // FOR UPDATE lock prevents race conditions
    });
    
    // 2. Check sufficient balance
    if (credit.balance < amount) {
      throw new InsufficientCreditsError();
    }
    
    // 3. Deduct credits
    await tx.credit.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    });
    
    // 4. Create transaction record
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'spend',
        amount: -amount,
        balanceBefore: credit.balance,
        balanceAfter: credit.balance - amount
      }
    });
    
    return true;
  });
}
```

**Failure Modes:**
- Race condition: Prevented by database transaction + SELECT FOR UPDATE
- Negative balance: Check before deduction
- Network failure during M-Pesa: Mark as "pending", manual reconciliation

---

## 5.4 Upload Service

**Responsibility:** Handle photo/video uploads to S3

**APIs:**
- `POST /uploads/presigned-url` - Get presigned S3 URL
- `POST /uploads/confirm` - Confirm upload complete

**Key Design:**
```typescript
// Client-side direct upload to S3
// 1. Request presigned URL from backend
// 2. Upload directly to S3 (client → S3, no backend)
// 3. Confirm upload to backend (store S3 key in DB)

async getPresignedUrl(
  userId: string, 
  filename: string, 
  contentType: string
) {
  const key = `listings/${userId}/${Date.now()}-${filename}`;
  
  const url = await s3.getSignedUrlPromise('putObject', {
    Bucket: 'pataspace-media',
    Key: key,
    ContentType: contentType,
    Expires: 300,  // 5 minutes
    Conditions: [
      ['content-length-range', 0, 10485760]  // Max 10MB
    ]
  });
  
  return { url, key };
}
```

**Performance:**
- Client → S3 direct (no backend bottleneck)
- Presigned URLs expire in 5 minutes (security)
- Max file size: 10MB (validation)
- Supported types: image/jpeg, image/png, video/mp4

**Scaling Strategy:**
- S3 scales infinitely
- Backend only generates URLs (stateless)
- Cloudflare CDN caches images

---

# 6. SCALABILITY STRATEGY

## 6.1 Current Capacity (Single Server)

**DigitalOcean Droplet (4GB RAM, 2 vCPU):**
- Can handle: 100-200 QPS
- Current load: 0.1-1 QPS
- **Headroom: 100-200x**

**PostgreSQL Managed Database:**
- Can handle: 1,000 QPS (simple queries)
- Current load: 1 QPS
- **Headroom: 1,000x**

**Verdict:** No scaling needed for MVP. Single server sufficient.

---

## 6.2 Scaling Path (When Needed)

### Phase 1: Vertical Scaling (Users: 10K → 50K)
- Upgrade droplet: 4GB → 8GB RAM
- Upgrade database: Basic → Standard tier
- **Cost: $50/mo → $150/mo**
- **Capacity: 10x increase**

### Phase 2: Horizontal Scaling (Users: 50K → 200K)
- Add read replicas for database (browse queries)
- Add CDN for API responses (Cloudflare Workers)
- Add Redis cluster for caching
- Load balancer: 2-3 app servers
- **Cost: $150/mo → $500/mo**
- **Capacity: 5x increase**

### Phase 3: Microservices (Users: 200K+)
- Split services: Auth, Listing, Payment, Upload
- Event-driven architecture (RabbitMQ/Kafka)
- Separate databases per service
- Kubernetes orchestration
- **Cost: $500/mo → $2,000+/mo**

**Current Decision: Build monolith, monitor metrics, scale when needed.**

---

## 6.3 Caching Strategy

### L1: Browser Cache (Static Assets)
- Photos, videos: Cache-Control: max-age=31536000 (1 year)
- HTML, CSS, JS: max-age=3600 (1 hour)

### L2: CDN Cache (Cloudflare)
- All S3 media: Cached at edge (14+ datacenters in Africa)
- Listing API responses: Cache for 5 minutes (stale-while-revalidate)

### L3: Redis Cache (Application)
```typescript
// Cache patterns
const CACHE_KEYS = {
  userCredits: (userId) => `credits:${userId}`,        // TTL: 5 min
  listingDetails: (id) => `listing:${id}`,             // TTL: 1 hour
  browseResults: (hash) => `browse:${hash}`,           // TTL: 5 min
};

// Cache invalidation
// - On credit spend: Delete credits:userId
// - On listing update: Delete listing:id
// - On new listing: Delete all browse:* keys
```

### L4: Database Query Cache (PostgreSQL)
- Shared buffers: 1GB (25% of RAM)
- Effective cache size: 3GB

---

# 7. RELIABILITY & FAULT TOLERANCE

## 7.1 Single Points of Failure (SPOFs)

| Component | SPOF? | Mitigation |
|-----------|-------|------------|
| App Server | ✅ YES | Monitoring + auto-restart |
| Database | ✅ YES | Managed DB with daily backups |
| S3 | ❌ NO | 99.99% SLA from AWS |
| M-Pesa API | ✅ YES | Retry logic + manual fallback |
| SMS API | ✅ YES | Fallback to Twilio |

**MVP Acceptance:** Some SPOFs acceptable for 90-day launch. Address in Phase 2.

---

## 7.2 Failure Scenarios & Handling

### Scenario 1: Database Connection Lost

**Impact:** All API requests fail

**Detection:** Health check endpoint fails 3 times in 1 minute

**Response:**
1. Retry connection (3 attempts, exponential backoff)
2. If still failing: Alert admin via SMS
3. Restart app server (PM2 auto-restart)
4. Manual intervention if persists

**Prevention:**
- Connection pooling (max: 20 connections)
- Idle timeout: 10 seconds
- Health checks every 30 seconds

---

### Scenario 2: M-Pesa API Timeout

**Impact:** Credit purchase hangs, user frustrated

**Detection:** No callback received within 60 seconds

**Response:**
1. Return to user: "Payment pending, you'll get SMS confirmation"
2. Mark transaction as "pending_confirmation"
3. Cron job checks M-Pesa API for transaction status (every 5 min)
4. Manual reconciliation dashboard for admin

**Prevention:**
- Set timeout: 60 seconds for STK Push
- Idempotency keys prevent duplicate charges
- User can retry after 2 minutes

---

### Scenario 3: S3 Upload Fails

**Impact:** User cannot post listing

**Detection:** Presigned URL expired or upload error

**Response:**
1. Retry upload (client-side, 3 attempts)
2. If still failing: Show error "Upload failed, please try again"
3. Log error with correlation ID for debugging

**Prevention:**
- Presigned URLs valid for 5 minutes
- Client-side retry logic
- File size validation before upload

---

## 7.3 Circuit Breaker Pattern

**For External APIs (M-Pesa, SMS):**

```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime?: Date;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if should attempt recovery
      if (Date.now() - this.lastFailureTime.getTime() > 60000) {
        this.state = 'half-open';
      } else {
        throw new CircuitBreakerOpenError();
      }
    }
    
    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = new Date();
      
      if (this.failureCount >= 5) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
}
```

**Thresholds:**
- Open circuit after: 5 consecutive failures
- Recovery attempt after: 1 minute
- If recovery succeeds: Close circuit

---

# 8. SECURITY ARCHITECTURE

## 8.1 Authentication & Authorization

```typescript
// Role-based access control (RBAC)
enum Role {
  USER = 'user',
  ADMIN = 'admin'
}

// Permission matrix
const PERMISSIONS = {
  'listings:create': [Role.USER],
  'listings:read': [Role.USER, Role.ADMIN],
  'listings:approve': [Role.ADMIN],
  'disputes:resolve': [Role.ADMIN],
  'users:ban': [Role.ADMIN],
};

// Guard decorator
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(Role.ADMIN)
async approveListin(id: string) {
  // Only admins can approve
}
```

---

## 8.2 Data Protection

### Encryption at Rest
- Database: PostgreSQL native encryption (enabled)
- S3: Server-side encryption (SSE-S3)
- PII fields: Application-level encryption (AES-256)
  ```typescript
  // Encrypt sensitive fields before storing
  const encryptedPhone = encrypt(phoneNumber, process.env.ENCRYPTION_KEY);
  ```

### Encryption in Transit
- TLS 1.3 for all HTTPS traffic
- Database connections: SSL required
- S3 uploads: HTTPS only

---

## 8.3 Input Validation

```typescript
// Zod schemas for all endpoints
const CreateListingDto = z.object({
  county: z.string().min(1).max(50),
  neighborhood: z.string().min(1).max(50),
  monthlyRent: z.number().min(2000).max(500000),
  bedrooms: z.number().min(0).max(10),
  bathrooms: z.number().min(0).max(10),
  availableDate: z.date().min(new Date()),
  photos: z.array(z.string().url()).min(5).max(15),
  video: z.string().url(),
});

// Automatic validation in NestJS
@Post('/listings')
async create(@Body() dto: CreateListingDto) {
  // dto is validated and type-safe
}
```

---

## 8.4 Rate Limiting

```typescript
// Per-user rate limits (stored in Redis)
const RATE_LIMITS = {
  'POST /auth/register': { limit: 3, window: 3600 },      // 3/hour
  'POST /auth/login': { limit: 5, window: 3600 },         // 5/hour
  'POST /listings': { limit: 10, window: 86400 },         // 10/day
  'POST /credits/purchase': { limit: 10, window: 86400 }, // 10/day
  'POST /unlocks': { limit: 50, window: 86400 },          // 50/day
};

// Global rate limit: 100 requests/minute per user
```

---

# 9. OBSERVABILITY & OPERATIONS

## 9.1 Logging Strategy

```typescript
// Structured logging (Winston)
logger.info('Listing created', {
  userId: user.id,
  listingId: listing.id,
  county: listing.county,
  rent: listing.monthlyRent,
  correlationId: req.id,
});

// Log levels
// ERROR: System failures, exceptions
// WARN: Rate limits, validation failures
// INFO: Business events (listing created, unlock, payment)
// DEBUG: Detailed flow (disabled in production)
```

**Log Aggregation:** CloudWatch Logs (7-day retention)

---

## 9.2 Metrics & Monitoring

```typescript
// Key metrics (tracked in Redis)
const METRICS = {
  'api.requests': Counter,
  'api.latency': Histogram,
  'db.query.time': Histogram,
  'uploads.success': Counter,
  'uploads.failure': Counter,
  'mpesa.success': Counter,
  'mpesa.failure': Counter,
  'users.active.daily': Gauge,
  'listings.created.daily': Counter,
  'unlocks.daily': Counter,
};

// Prometheus export endpoint
GET /metrics
```

---

## 9.3 Health Checks

```typescript
GET /health

Response:
{
  status: 'healthy',
  timestamp: '2026-03-20T10:00:00Z',
  checks: {
    database: 'healthy',     // Can connect + query
    redis: 'healthy',        // Can ping
    s3: 'healthy',           // Can list buckets
    mpesa: 'degraded',       // Slow response (>2s)
  }
}
```

**Monitoring:**
- UptimeRobot: Ping /health every 5 minutes
- Alert if 3 consecutive failures

---

## 9.4 Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| API Down | /health fails 3x | CRITICAL | SMS to admin |
| High Error Rate | >5% requests fail | HIGH | SMS + email |
| DB Slow Queries | p95 >500ms | MEDIUM | Email |
| M-Pesa Failures | >10% fail | HIGH | SMS |
| Disk Space Low | <10% free | HIGH | Email |

---

# 10. DEPLOYMENT ARCHITECTURE

## 10.1 MVP Deployment (DigitalOcean)

```
┌─────────────────────────────────────────┐
│  pataspace.co.ke (Domain)               │
└────────────┬────────────────────────────┘
             │ DNS (Cloudflare)
             ▼
┌─────────────────────────────────────────┐
│  Cloudflare CDN + DDoS Protection       │
└────────────┬────────────────────────────┘
             │ HTTPS (TLS 1.3)
             ▼
┌─────────────────────────────────────────┐
│  DigitalOcean Droplet (Nairobi Region)  │
│  Ubuntu 22.04, 4GB RAM, 2 vCPU          │
│  ┌─────────────────────────────────────┐│
│  │ NGINX (Reverse Proxy)               ││
│  │ - SSL termination                   ││
│  │ - Rate limiting                     ││
│  │ - Static file serving               ││
│  └────────────┬────────────────────────┘│
│               ▼                          │
│  ┌─────────────────────────────────────┐│
│  │ PM2 Process Manager                 ││
│  │ ┌─────────────────────────────────┐ ││
│  │ │ NestJS App (Port 3000)          │ ││
│  │ │ - Workers: 2 (cluster mode)     │ ││
│  │ │ - Auto-restart on crash         │ ││
│  │ └─────────────────────────────────┘ ││
│  └─────────────────────────────────────┘│
│                                          │
│  ┌─────────────────────────────────────┐│
│  │ Redis (Port 6379)                   ││
│  │ - Cache + Queue                     ││
│  │ - Persistence: AOF                  ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Managed Database            │
│  (DigitalOcean)                         │
│  - 1GB RAM, 10GB Storage                │
│  - Daily backups (7-day retention)      │
│  - SSL required                         │
└─────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  AWS S3 (af-south-1)                    │
│  - Photos + Videos                      │
│  - Lifecycle: Delete after 180 days     │
│  - Versioning: Disabled                 │
└─────────────────────────────────────────┘
```

---

## 10.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Build Docker image
      - run: docker build -t pataspace-api .
      
      # Push to registry
      - run: docker push pataspace-api:latest
      
      # SSH to server and deploy
      - run: |
          ssh deploy@pataspace.co.ke << 'EOF'
            docker pull pataspace-api:latest
            docker stop pataspace-api || true
            docker run -d --name pataspace-api \
              --env-file /etc/pataspace/.env \
              -p 3000:3000 \
              pataspace-api:latest
            
            # Run migrations
            docker exec pataspace-api npm run migrate:deploy
          EOF
```

**Deployment Strategy:**
- Zero-downtime: Use PM2 cluster mode reload
- Rollback: Keep previous Docker image, can revert in 30 seconds
- Migrations: Run before app restart (Prisma migrate deploy)

---

## 10.3 Backup Strategy

| Data | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| PostgreSQL | Daily (3 AM) | 7 days | DigitalOcean |
| Redis | Daily (4 AM) | 3 days | Local disk |
| S3 | N/A | Versioning off | AWS |
| Code | Every commit | Forever | GitHub |

**Recovery Time Objective (RTO):** 2 hours  
**Recovery Point Objective (RPO):** 24 hours  

---

# 11. TRADE-OFF SUMMARY

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| **Monolith vs Microservices** | Simplicity vs Scalability | MVP scale doesn't need microservices. Monolith faster to build. |
| **PostgreSQL vs NoSQL** | ACID vs Scalability | Credits need ACID. Listings fit relational model. Scale is vertical. |
| **S3 vs Database BLOBs** | Cost vs Simplicity | S3 is 5x cheaper. Easier to scale. Better CDN integration. |
| **SSR vs SPA** | SEO vs Simplicity | Listings need SEO for organic traffic. Worth the complexity. |
| **React Native vs Native** | Dev Speed vs Performance | 90-day timeline. Performance is acceptable for our use case. |
| **Single Server vs Cluster** | Cost vs Reliability | MVP budget. 99.5% uptime acceptable. Can add redundancy later. |
| **M-Pesa Only vs Multi-Payment** | Reach vs Complexity | Kenya market. M-Pesa has 95% penetration. Add cards later. |
| **Manual Review vs Auto** | Safety vs Scale | First 3 listings human-reviewed prevents fraud. Automate after trust. |

---

# 12. FUTURE IMPROVEMENTS

## When Users > 50,000

1. **Read Replicas:** Separate read/write databases
2. **CDN API Caching:** Cache browse endpoints at edge
3. **Image Processing:** On-the-fly resizing (Cloudflare Images)
4. **Search:** Elasticsearch for full-text + geo search
5. **Analytics:** Mixpanel/Amplitude for user behavior
6. **A/B Testing:** Optimizely for feature experiments

## When Users > 200,000

1. **Microservices:** Split into Auth, Listing, Payment services
2. **Event Streaming:** Kafka for async communication
3. **Multi-Region:** Deploy to multiple African regions
4. **GraphQL:** Replace REST for mobile (reduce round-trips)
5. **Machine Learning:** Fraud detection, price suggestions

---

# 13. CONCLUSION

This architecture is designed for:
- **Clarity:** Simple enough for 2-3 developers to build in 90 days
- **Correctness:** ACID transactions where money is involved
- **Cost:** <$50/month for MVP
- **Scalability:** Can grow to 50K users without major changes

**The system prioritizes getting to market quickly while maintaining data integrity and user trust.**

**Next Steps:**
1. Review database schema (separate document)
2. Review API specifications (separate document)
3. Set up infrastructure (DigitalOcean + PostgreSQL)
4. Begin Week 1 development

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Next Review:** After MVP launch (Month 3)
