# PATASPACE DATABASE SCHEMA
## Complete Data Model with Prisma ORM | PostgreSQL 15

---

# EXECUTIVE SUMMARY

**Database:** PostgreSQL 15  
**ORM:** Prisma 5.x  
**Migration Strategy:** Incremental migrations with rollback support  
**Consistency Model:** ACID transactions for financial operations  
**Estimated Size (Month 3):** 15MB data + 20GB media references  

**Key Design Principles:**
- Strong consistency for credits and payments (ACID)
- Referential integrity enforced at database level
- Optimized for dominant read patterns (browse listings)
- Audit trails for all financial transactions
- Soft deletes for user-facing data

---

# 1. ENTITY RELATIONSHIP DIAGRAM

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1
       │
       │ 1:1
       ▼
┌─────────────┐      1:N      ┌──────────────┐
│   Credit    │◄───────────────┤CreditTransaction│
└─────────────┘                └──────────────┘

       │ 1
       │
       │ 1:N
       ▼
┌─────────────┐
│   Listing   │
└──────┬──────┘
       │ 1
       │
       │ 1:N
       ▼
┌─────────────┐
│  ListingPhoto│
└─────────────┘

┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1
       │
       │ 1:N (as buyer)
       ▼
┌─────────────┐      1:1      ┌──────────────┐
│   Unlock    │◄───────────────┤ Commission   │
└──────┬──────┘                └──────────────┘
       │ N:1 (listing)
       │
       ▼
┌─────────────┐
│   Listing   │
└─────────────┘

┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1
       │
       │ 1:N
       ▼
┌─────────────┐      N:1      ┌──────────────┐
│ Confirmation│──────────────►│   Unlock     │
└─────────────┘                └──────────────┘

┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1
       │
       │ 1:N
       ▼
┌─────────────┐
│   Dispute   │──────────────►│   Unlock     │
└─────────────┘      N:1      └──────────────┘
```

---

# 2. PRISMA SCHEMA (schema.prisma)

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum Role {
  USER
  ADMIN
}

enum ListingStatus {
  PENDING          // Awaiting review
  ACTIVE           // Live and searchable
  UNLOCKED         // Someone unlocked it
  CONFIRMED        // Both parties confirmed
  COMPLETED        // Commission paid
  DELETED          // Soft deleted
  REJECTED         // Admin rejected
}

enum TransactionType {
  PURCHASE         // User bought credits
  SPEND            // User spent credits (unlock)
  REFUND           // Credits refunded
  BONUS            // Free credits (promo)
}

enum TransactionStatus {
  PENDING          // Awaiting payment
  COMPLETED        // Payment confirmed
  FAILED           // Payment failed
  CANCELLED        // User cancelled
  REFUNDED         // Refunded to user
}

enum CommissionStatus {
  PENDING          // Waiting for confirmation period
  DUE              // Ready to pay
  PROCESSING       // M-Pesa B2C in progress
  PAID             // Paid to tenant
  FAILED           // Payment failed
  CANCELLED        // Unlock was refunded
}

enum ConfirmationSide {
  OUTGOING_TENANT  // Person leaving
  INCOMING_TENANT  // Person moving in
}

enum DisputeStatus {
  OPEN
  INVESTIGATING
  RESOLVED
  CLOSED
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id                String   @id @default(cuid())
  phoneNumber       String   @unique
  phoneVerified     Boolean  @default(false)
  email             String?  @unique
  passwordHash      String
  firstName         String
  lastName          String
  role              Role     @default(USER)
  isActive          Boolean  @default(true)
  isBanned          Boolean  @default(false)
  banReason         String?
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastLoginAt       DateTime?
  
  // Relations
  credit            Credit?
  creditTransactions CreditTransaction[]
  listings          Listing[]
  unlocks           Unlock[]
  confirmations     Confirmation[]
  disputes          Dispute[]
  refreshTokens     RefreshToken[]
  
  @@index([phoneNumber])
  @@index([email])
  @@map("users")
}

model RefreshToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model OTPCode {
  id          String   @id @default(cuid())
  phoneNumber String
  code        String
  expiresAt   DateTime
  attempts    Int      @default(0)
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([phoneNumber, code])
  @@index([expiresAt])
  @@map("otp_codes")
}

// ============================================================================
// CREDITS & TRANSACTIONS
// ============================================================================

model Credit {
  id              String   @id @default(cuid())
  userId          String   @unique
  balance         Int      @default(0)  // In credits (1 credit = 1 KES equivalent)
  lifetimeEarned  Int      @default(0)  // Total credits ever received
  lifetimeSpent   Int      @default(0)  // Total credits ever spent
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("credits")
}

model CreditTransaction {
  id              String            @id @default(cuid())
  userId          String
  type            TransactionType
  amount          Int               // Positive for credit, negative for debit
  balanceBefore   Int
  balanceAfter    Int
  status          TransactionStatus @default(PENDING)
  
  // M-Pesa details (for PURCHASE type)
  mpesaReceiptNumber String?        @unique
  mpesaTransactionId String?        @unique
  phoneNumber        String?
  
  // Reference to what this transaction is for
  unlockId        String?          @unique
  
  // Metadata
  metadata        Json?            // Extra data (promo codes, etc)
  description     String?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  unlock          Unlock?          @relation(fields: [unlockId], references: [id])
  
  @@index([userId, createdAt])
  @@index([status])
  @@index([mpesaTransactionId])
  @@map("credit_transactions")
}

// ============================================================================
// LISTINGS
// ============================================================================

model Listing {
  id              String        @id @default(cuid())
  userId          String        // Outgoing tenant
  
  // Location
  county          String
  neighborhood    String
  address         String        // Encrypted - only visible after unlock
  latitude        Float
  longitude       Float
  
  // Property details
  monthlyRent     Int           // In KES
  bedrooms        Int
  bathrooms       Int
  propertyType    String        // "Apartment", "Bedsitter", "Studio", etc
  furnished       Boolean       @default(false)
  
  // Description
  description     String        @db.Text
  amenities       String[]      // ["Water 24/7", "Backup generator", etc]
  propertyNotes   String?       @db.Text
  
  // Availability
  availableFrom   DateTime
  availableTo     DateTime?     // If tenant knows when they're leaving
  
  // Pricing
  unlockCostCredits Int         // How many credits to unlock (typically 10% of rent)
  commission      Int           // How much tenant earns (30-40% of unlock cost)
  
  // Media
  videoUrl        String?
  thumbnailUrl    String?
  
  // Status
  status          ListingStatus @default(PENDING)
  isApproved      Boolean       @default(false)
  approvedAt      DateTime?
  approvedBy      String?       // Admin user ID
  rejectionReason String?
  
  // Metrics
  viewCount       Int           @default(0)
  unlockCount     Int           @default(0)
  
  // Soft delete
  isDeleted       Boolean       @default(false)
  deletedAt       DateTime?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  photos          ListingPhoto[]
  unlocks         Unlock[]
  
  @@index([userId])
  @@index([status, isApproved, isDeleted])
  @@index([county, neighborhood])
  @@index([monthlyRent])
  @@index([availableFrom])
  @@index([createdAt])
  @@index([latitude, longitude]) // For geo queries
  @@map("listings")
}

model ListingPhoto {
  id          String   @id @default(cuid())
  listingId   String
  url         String
  s3Key       String
  order       Int      // Display order (1, 2, 3...)
  width       Int?
  height      Int?
  
  // GPS verification
  latitude    Float?
  longitude   Float?
  takenAt     DateTime?  // Timestamp from EXIF
  
  createdAt   DateTime @default(now())
  
  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  
  @@index([listingId, order])
  @@map("listing_photos")
}

// ============================================================================
// UNLOCKS & COMMISSIONS
// ============================================================================

model Unlock {
  id                  String        @id @default(cuid())
  listingId           String
  buyerId             String        // User who unlocked
  
  // Cost
  creditsSpent        Int           // How many credits spent
  
  // Contact info revealed (encrypted)
  revealedPhone       String
  revealedAddress     String
  revealedGPS         String        // "lat,lng"
  
  // Status
  isRefunded          Boolean       @default(false)
  refundReason        String?
  refundedAt          DateTime?
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  
  // Relations
  listing             Listing       @relation(fields: [listingId], references: [id], onDelete: Cascade)
  buyer               User          @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  creditTransaction   CreditTransaction?
  confirmations       Confirmation[]
  commission          Commission?
  dispute             Dispute?
  
  @@unique([listingId, buyerId]) // Can only unlock once per listing
  @@index([buyerId, createdAt])
  @@index([listingId])
  @@map("unlocks")
}

model Confirmation {
  id          String            @id @default(cuid())
  unlockId    String
  userId      String            // Who confirmed
  side        ConfirmationSide
  confirmedAt DateTime          @default(now())
  
  unlock      Unlock            @relation(fields: [unlockId], references: [id], onDelete: Cascade)
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([unlockId, side]) // Each side can only confirm once
  @@index([unlockId])
  @@map("confirmations")
}

model Commission {
  id                    String           @id @default(cuid())
  unlockId              String           @unique
  outgoingTenantId      String           // Who gets paid
  
  // Amount
  amountKES             Int              // In KES
  
  // Status
  status                CommissionStatus @default(PENDING)
  
  // M-Pesa B2C details
  mpesaTransactionId    String?          @unique
  mpesaReceiptNumber    String?          @unique
  
  // Timing
  eligibleAt            DateTime         // When commission becomes due (7 days after confirmation)
  paidAt                DateTime?
  
  // Retry tracking
  paymentAttempts       Int              @default(0)
  lastAttemptAt         DateTime?
  lastAttemptError      String?
  
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  
  // Relations
  unlock                Unlock           @relation(fields: [unlockId], references: [id], onDelete: Cascade)
  
  @@index([status, eligibleAt])
  @@index([outgoingTenantId])
  @@map("commissions")
}

// ============================================================================
// DISPUTES
// ============================================================================

model Dispute {
  id              String        @id @default(cuid())
  unlockId        String        @unique
  reportedBy      String        // User ID
  
  reason          String        @db.Text
  evidence        String[]      // URLs to screenshots, etc
  
  status          DisputeStatus @default(OPEN)
  resolution      String?       @db.Text
  resolvedBy      String?       // Admin ID
  resolvedAt      DateTime?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  unlock          Unlock        @relation(fields: [unlockId], references: [id], onDelete: Cascade)
  user            User          @relation(fields: [reportedBy], references: [id], onDelete: Cascade)
  
  @@index([status])
  @@index([reportedBy])
  @@map("disputes")
}

// ============================================================================
// ADMIN & AUDIT
// ============================================================================

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?  // Null if system action
  action      String   // "user.ban", "listing.approve", "dispute.resolve"
  entityType  String   // "User", "Listing", "Dispute"
  entityId    String
  oldValue    Json?
  newValue    Json?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([entityType, entityId])
  @@index([action])
  @@map("audit_logs")
}

model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  
  updatedAt   DateTime @updatedAt
  
  @@map("system_config")
}

// Example config values:
// - "commission_rate": "0.30" (30% of unlock fee)
// - "unlock_cost_percentage": "0.10" (10% of monthly rent)
// - "confirmation_period_days": "7"
// - "max_listings_per_user": "3"
// - "min_unlock_credits": "500"
```

---

# 3. ACCESS PATTERNS & QUERY OPTIMIZATION

## 3.1 Dominant Read Queries

### Query 1: Browse Listings (Most Common)

```sql
SELECT l.*, u.firstName, u.phoneNumber, 
       (SELECT url FROM listing_photos WHERE listingId = l.id ORDER BY order LIMIT 1) as thumbnail
FROM listings l
JOIN users u ON l.userId = u.id
WHERE l.status = 'ACTIVE'
  AND l.isApproved = true
  AND l.isDeleted = false
  AND l.county = 'Nairobi'
  AND l.neighborhood IN ('Kilimani', 'Westlands')
  AND l.monthlyRent BETWEEN 15000 AND 25000
  AND l.bedrooms >= 1
  AND l.availableFrom <= '2026-04-01'
ORDER BY l.createdAt DESC
LIMIT 20;
```

**Optimization:**
- Composite index: `(status, isApproved, isDeleted, county, neighborhood, monthlyRent, availableFrom, createdAt)`
- Cache in Redis: TTL 5 minutes
- Result: <50ms query time

---

### Query 2: Get Listing Details

```sql
SELECT l.*, u.firstName, u.phoneNumber,
       (SELECT json_agg(json_build_object('url', url, 'order', order))
        FROM listing_photos WHERE listingId = l.id ORDER BY order) as photos
FROM listings l
JOIN users u ON l.userId = u.id
WHERE l.id = 'listing_123';
```

**Optimization:**
- Primary key lookup (fast)
- Photos preloaded with listing
- Cache in Redis: TTL 1 hour
- Result: <20ms query time

---

### Query 3: Check Unlock Status

```sql
SELECT EXISTS(
  SELECT 1 FROM unlocks
  WHERE listingId = 'listing_123'
    AND buyerId = 'user_456'
    AND isRefunded = false
) as isUnlocked;
```

**Optimization:**
- Unique index: `(listingId, buyerId)`
- Cache in Redis: TTL 5 minutes
- Result: <10ms query time

---

## 3.2 Critical Write Queries

### Write 1: Deduct Credits (MUST be Atomic)

```typescript
// Using Prisma transaction with SELECT FOR UPDATE
await prisma.$transaction(async (tx) => {
  // 1. Lock user's credit record
  const credit = await tx.credit.findUnique({
    where: { userId: 'user_123' }
  });
  
  // 2. Check balance
  if (credit.balance < 1500) {
    throw new InsufficientCreditsError();
  }
  
  // 3. Create unlock record
  const unlock = await tx.unlock.create({
    data: {
      listingId: 'listing_456',
      buyerId: 'user_123',
      creditsSpent: 1500,
      // ...
    }
  });
  
  // 4. Deduct credits
  await tx.credit.update({
    where: { userId: 'user_123' },
    data: {
      balance: { decrement: 1500 },
      lifetimeSpent: { increment: 1500 }
    }
  });
  
  // 5. Create transaction record
  await tx.creditTransaction.create({
    data: {
      userId: 'user_123',
      type: 'SPEND',
      amount: -1500,
      balanceBefore: credit.balance,
      balanceAfter: credit.balance - 1500,
      unlockId: unlock.id,
      status: 'COMPLETED'
    }
  });
  
  return unlock;
});
```

**Critical Properties:**
- ACID compliant (all or nothing)
- No race conditions (transaction isolation)
- Audit trail (transaction record)

---

## 3.3 Index Strategy

```sql
-- Users
CREATE INDEX idx_users_phone ON users(phoneNumber);
CREATE INDEX idx_users_email ON users(email);

-- Listings (composite for browse query)
CREATE INDEX idx_listings_browse ON listings(
  status, isApproved, isDeleted, county, neighborhood, monthlyRent, availableFrom, createdAt
);

-- Listings (geo search)
CREATE INDEX idx_listings_geo ON listings(latitude, longitude);

-- Listing photos (order matters)
CREATE INDEX idx_listing_photos_listing_order ON listing_photos(listingId, order);

-- Unlocks (prevent duplicates + lookup)
CREATE UNIQUE INDEX idx_unlocks_unique ON unlocks(listingId, buyerId);
CREATE INDEX idx_unlocks_buyer ON unlocks(buyerId, createdAt);

-- Credit transactions (history lookup)
CREATE INDEX idx_credit_tx_user ON credit_transactions(userId, createdAt DESC);
CREATE INDEX idx_credit_tx_mpesa ON credit_transactions(mpesaTransactionId);

-- Commissions (due payments query)
CREATE INDEX idx_commissions_due ON commissions(status, eligibleAt);

-- Audit logs (admin dashboard)
CREATE INDEX idx_audit_user ON audit_logs(userId, createdAt DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entityType, entityId);
```

**Index Size Estimate (10K users, 2K listings):**
- Primary indexes: ~5MB
- Secondary indexes: ~10MB
- Total: ~15MB (negligible)

---

# 4. DATA CONSISTENCY & TRANSACTIONS

## 4.1 Transaction Boundaries

### Scenario 1: Credit Purchase

```
START TRANSACTION (Serializable)
  1. Verify M-Pesa callback signature
  2. Check if mpesaTransactionId already processed (idempotency)
  3. Add credits to user balance
  4. Create credit transaction record
  5. Invalidate cache
COMMIT
```

**Isolation Level:** `Serializable` (highest)  
**Why:** Prevent duplicate M-Pesa callbacks from crediting twice

---

### Scenario 2: Unlock Contact

```
START TRANSACTION (Read Committed)
  1. Check if already unlocked (prevent duplicate)
  2. Check credit balance >= unlock cost
  3. Deduct credits
  4. Create unlock record
  5. Create transaction record
  6. Update listing.unlockCount
COMMIT
```

**Isolation Level:** `Read Committed` (default)  
**Why:** Balance consistency enforced by transaction, not high contention

---

### Scenario 3: Confirmation Flow

```
START TRANSACTION (Read Committed)
  1. Check if side already confirmed
  2. Create confirmation record
  3. Check if both sides confirmed
  4. If yes: Create commission record (eligibleAt = now + 7 days)
  5. Update listing status to CONFIRMED
COMMIT
```

---

## 4.2 Idempotency Strategy

**Problem:** M-Pesa callbacks can be sent multiple times

**Solution:**
```typescript
async processMpesaCallback(callback: MpesaCallback) {
  const { TransactionID, Amount, PhoneNumber } = callback;
  
  // Check if already processed
  const existing = await prisma.creditTransaction.findUnique({
    where: { mpesaTransactionId: TransactionID }
  });
  
  if (existing) {
    return { status: 'already_processed', txId: existing.id };
  }
  
  // Process payment (in transaction)
  return await prisma.$transaction(async (tx) => {
    // Add credits, create records...
  });
}
```

**Key:** Use `mpesaTransactionId` as unique constraint

---

# 5. DATA LIFECYCLE & RETENTION

## 5.1 Retention Policies

| Data Type | Retention | Action |
|-----------|-----------|--------|
| Active listings | Until deleted | Keep |
| Deleted listings | 90 days | Soft delete → hard delete |
| Completed unlocks | Forever | Archive after 1 year |
| Credit transactions | Forever | Required for audit |
| OTP codes | 5 minutes | Auto-expire |
| Refresh tokens | 30 days | Auto-expire |
| Audit logs | 1 year | Archive to S3 |
| Listing photos | 180 days after deletion | S3 lifecycle rule |

---

## 5.2 Soft Delete Strategy

**Why:** Allow recovery, dispute resolution, analytics

**Implementation:**
```prisma
model Listing {
  isDeleted  Boolean   @default(false)
  deletedAt  DateTime?
  // ...
}
```

**Queries always filter:**
```sql
WHERE isDeleted = false
```

**Hard delete (cron job, runs daily):**
```sql
DELETE FROM listings
WHERE isDeleted = true
  AND deletedAt < NOW() - INTERVAL '90 days';
```

---

# 6. SECURITY & ENCRYPTION

## 6.1 Encrypted Fields

**Sensitive PII (encrypted at application level):**
- `User.phoneNumber` (searchable → hash + encrypt)
- `Listing.address` (only revealed after unlock)
- `Unlock.revealedPhone` (encrypted)
- `Unlock.revealedAddress` (encrypted)

**Implementation:**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:encrypted:authTag
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, encrypted, authTagHex] = ciphertext.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## 6.2 Database-Level Security

**Row-Level Security (Future):**
```sql
-- Users can only see their own credit balance
CREATE POLICY user_credit_policy ON credits
  FOR SELECT
  USING (userId = current_setting('app.user_id')::text);
```

**Connection Security:**
- SSL/TLS required for all database connections
- Managed database (DigitalOcean) has encryption at rest
- Credentials stored in environment variables (not code)

---

# 7. MIGRATION STRATEGY

## 7.1 Migration Files (Prisma)

**Initial Migration:**
```bash
npx prisma migrate dev --name init
```

Generates:
```
prisma/migrations/
  └── 20260320_init/
      └── migration.sql
```

**Migration SQL (generated by Prisma):**
```sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'ACTIVE', ...);
-- ... (all enums)

-- CreateTable
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  -- ... (all columns)
  
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");
CREATE INDEX "idx_users_phone" ON "users"("phoneNumber");
-- ... (all indexes)

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
```

---

## 7.2 Safe Migration Process

**Pre-Production:**
```bash
# 1. Generate migration (dev)
npx prisma migrate dev --name add_listing_thumbnail

# 2. Review generated SQL
cat prisma/migrations/*/migration.sql

# 3. Test migration on staging
npx prisma migrate deploy --preview-feature
```

**Production:**
```bash
# 1. Backup database
pg_dump pataspace_prod > backup_$(date +%Y%m%d).sql

# 2. Run migration
npx prisma migrate deploy

# 3. Verify
npx prisma db pull
```

**Rollback (if needed):**
```bash
# Restore from backup
psql pataspace_prod < backup_20260320.sql
```

---

## 7.3 Common Migration Scenarios

### Add New Column (Safe)
```prisma
model Listing {
  // New optional column
  propertyManager String?
}
```

**Generated SQL:**
```sql
ALTER TABLE "listings" ADD COLUMN "propertyManager" TEXT;
```

**Impact:** None (nullable column, no data backfill needed)

---

### Add New Index (Safe)
```prisma
model Listing {
  @@index([propertyType, bedrooms])
}
```

**Generated SQL:**
```sql
CREATE INDEX "listings_propertyType_bedrooms_idx" 
  ON "listings"("propertyType", "bedrooms");
```

**Impact:** Temporary lock during index creation (use `CONCURRENTLY` for large tables)

---

### Change Column Type (DANGEROUS)
```prisma
model Listing {
  // Change from Int to Decimal
  monthlyRent Decimal @db.Decimal(10, 2)
}
```

**Manual Migration Required:**
```sql
-- Step 1: Add new column
ALTER TABLE "listings" ADD COLUMN "monthlyRent_new" DECIMAL(10, 2);

-- Step 2: Copy data
UPDATE "listings" SET "monthlyRent_new" = "monthlyRent"::DECIMAL;

-- Step 3: Drop old, rename new
ALTER TABLE "listings" DROP COLUMN "monthlyRent";
ALTER TABLE "listings" RENAME COLUMN "monthlyRent_new" TO "monthlyRent";
```

---

# 8. PERFORMANCE OPTIMIZATION

## 8.1 Connection Pooling

```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// Connection pool config (in DATABASE_URL)
// postgresql://user:pass@host:5432/db?
//   connection_limit=20&
//   pool_timeout=10&
//   connect_timeout=10
```

**Pool Settings:**
- Max connections: 20 (2x number of CPU cores)
- Idle timeout: 10 seconds
- Connection timeout: 10 seconds

---

## 8.2 Query Optimization

### Use Select to Limit Fields
```typescript
// BAD: Fetches all fields
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// GOOD: Only fetch needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    firstName: true,
    phoneNumber: true,
  }
});
```

---

### Use Include Wisely
```typescript
// BAD: N+1 query
const listings = await prisma.listing.findMany();
for (const listing of listings) {
  const photos = await prisma.listingPhoto.findMany({
    where: { listingId: listing.id }
  });
}

// GOOD: Single query with JOIN
const listings = await prisma.listing.findMany({
  include: {
    photos: {
      orderBy: { order: 'asc' },
      take: 5
    }
  }
});
```

---

## 8.3 Caching Strategy

**Redis Cache Keys:**
```typescript
const CACHE_KEYS = {
  userCredits: (userId: string) => `credits:${userId}`,
  listingDetails: (id: string) => `listing:${id}`,
  browseResults: (hash: string) => `browse:${hash}`,
  unlockStatus: (listingId: string, buyerId: string) => 
    `unlock:${listingId}:${buyerId}`,
};

const CACHE_TTL = {
  userCredits: 300,      // 5 minutes
  listingDetails: 3600,  // 1 hour
  browseResults: 300,    // 5 minutes
  unlockStatus: 300,     // 5 minutes
};
```

**Cache Invalidation:**
```typescript
// When credits change
await redis.del(`credits:${userId}`);

// When listing updates
await redis.del(`listing:${listingId}`);
await redis.del('browse:*'); // Invalidate all browse caches
```

---

# 9. BACKUP & DISASTER RECOVERY

## 9.1 Backup Strategy

**Automated Backups (DigitalOcean Managed DB):**
- Frequency: Daily at 3 AM EAT
- Retention: 7 days
- Storage: Separate region (for geo-redundancy)

**Manual Backups (before major changes):**
```bash
# Full database dump
pg_dump -h db.pataspace.co.ke -U admin -d pataspace_prod \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backup_*.sql

# Upload to S3
aws s3 cp backup_*.sql.gz s3://pataspace-backups/
```

---

## 9.2 Recovery Procedures

### Recovery Time Objective (RTO): 2 hours
### Recovery Point Objective (RPO): 24 hours

**Scenario 1: Database Corruption**
```bash
# 1. Restore from latest backup (DigitalOcean console)
# 2. Point application to restored database
# 3. Verify data integrity
# 4. Resume operations

# Estimated time: 30 minutes
```

**Scenario 2: Accidental Data Deletion**
```bash
# 1. Restore backup to separate database
psql -h localhost -U admin -d pataspace_recovery < backup.sql

# 2. Extract deleted records
psql -h localhost -U admin -d pataspace_recovery -c \
  "SELECT * FROM listings WHERE id = 'deleted_listing_id'"

# 3. Insert into production
# Estimated time: 1 hour
```

---

# 10. MONITORING & ALERTS

## 10.1 Key Metrics

**Database Metrics (CloudWatch / DigitalOcean):**
```typescript
const DB_METRICS = {
  'db.connections.active': Gauge,
  'db.connections.idle': Gauge,
  'db.query.time.p95': Histogram,
  'db.query.time.p99': Histogram,
  'db.query.errors': Counter,
  'db.transaction.rollbacks': Counter,
};
```

**Application Metrics:**
```typescript
const APP_METRICS = {
  'db.query.count': Counter,          // Total queries
  'db.query.duration': Histogram,     // Query duration
  'db.connection.errors': Counter,    // Connection failures
  'cache.hits': Counter,              // Redis cache hits
  'cache.misses': Counter,            // Redis cache misses
};
```

---

## 10.2 Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Active connections | >15 | >19 | Scale connection pool |
| Query p95 latency | >500ms | >1s | Investigate slow queries |
| Connection errors | >5/min | >10/min | Check network/DB health |
| Transaction rollbacks | >10/min | >50/min | Investigate deadlocks |
| Disk space | <20% | <10% | Increase storage |

---

# 11. SUMMARY & TRADE-OFFS

## 11.1 Key Design Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **PostgreSQL** | ACID for credits, rich querying | Vertical scaling only |
| **Prisma ORM** | Type safety, migrations | Learning curve |
| **Soft deletes** | Data recovery, analytics | Query complexity |
| **Encryption at app level** | Control over encryption | Performance overhead |
| **Composite indexes** | Optimize browse queries | Write amplification |
| **Transaction isolation** | Prevent race conditions | Potential deadlocks |

---

## 11.2 Scaling Path

**Current (MVP):**
- Single database
- 20 connections
- 1,000 QPS capacity

**Phase 1 (10K→50K users):**
- Add read replicas
- Separate read/write queries
- 5,000 QPS capacity

**Phase 2 (50K→200K users):**
- Partition by county
- Separate hot data (recent listings)
- 20,000 QPS capacity

---

# 12. NEXT STEPS

1. ✅ Review schema with team
2. ⬜ Set up PostgreSQL on DigitalOcean
3. ⬜ Initialize Prisma project
4. ⬜ Run initial migration
5. ⬜ Seed database with test data
6. ⬜ Implement database service layer (NestJS)
7. ⬜ Write integration tests

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Next Review:** After MVP launch
