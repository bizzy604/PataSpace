# PATASPACE WORKFLOWS & STATE MACHINES
## Business Process Flows & State Transitions

---

# EXECUTIVE SUMMARY

**Document Purpose:** Define all business workflows and state transitions  
**Scope:** User journeys, listing lifecycle, payment flows, confirmation process  
**State Management:** Database-driven state machines with explicit transitions  
**Edge Case Coverage:** Comprehensive handling of failures and disputes  

---

# IMPLEMENTATION ALIGNMENT NOTE (2026-03-24)

- Canonical API base path is `/api/v1`.
- The overview diagram in section 1 is historical. The shipped backend keeps listing moderation and browse visibility on the listing record, while unlock, confirmation, dispute, refund, and commission progression live on related records.
- Unlock creation increments `listing.unlockCount`, but does not rely on changing the listing into a hidden browse state.
- Commission eligibility is created from the unlock workflow once both confirmation sides exist, using the latest confirmation timestamp plus 7 days.
- One-sided confirmations auto-progress after 14 days when the unlock is not refunded and no dispute is still `OPEN` or `INVESTIGATING`.
- Missed M-Pesa callbacks are recovered by a reconciliation job that queries STK status for stale pending purchases.
- Disputes support the full admin lifecycle: `OPEN -> INVESTIGATING -> RESOLVED -> CLOSED`.
- Dispute resolutions currently support `FULL_REFUND` or `NO_REFUND`. Partial-refund handling is not part of the shipped backend.

---

# 1. LISTING LIFECYCLE WORKFLOW

## 1.1 State Diagram

```
                                    ┌──────────┐
                                    │ PENDING  │ (First 3 listings)
                                    └────┬─────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
            │   APPROVED   │     │   REJECTED   │    │   DELETED    │
            │  (by admin)  │     │  (by admin)  │    │ (by user)    │
            └──────┬───────┘     └──────────────┘    └──────────────┘
                   │
                   ▼
            ┌──────────────┐
            │    ACTIVE    │ (Visible to all)
            └──────┬───────┘
                   │
                   │ Someone unlocks
                   ▼
            ┌──────────────┐
            │   UNLOCKED   │ (Contact revealed)
            └──────┬───────┘
                   │
                   │ Both parties confirm
                   ▼
            ┌──────────────┐
            │  CONFIRMED   │ (Commission pending)
            └──────┬───────┘
                   │
                   │ 7 days pass + commission paid
                   ▼
            ┌──────────────┐
            │  COMPLETED   │ (Final state)
            └──────────────┘
```

---

## 1.2 State Transitions

### PENDING → APPROVED
**Trigger:** Admin approves listing  
**Conditions:**
- Listing is in PENDING status
- Photos have GPS coordinates
- GPS coords match listing location (±100m)

**Actions:**
1. Update `listing.status = 'ACTIVE'`
2. Set `listing.isApproved = true`
3. Set `listing.approvedAt = now()`
4. Set `listing.approvedBy = admin.id`
5. Send SMS to tenant: "Your listing is now live!"
6. Invalidate cache (`listing:id`, `browse:*`)

**SQL:**
```sql
UPDATE listings
SET status = 'ACTIVE',
    is_approved = true,
    approved_at = NOW(),
    approved_by = $admin_id
WHERE id = $listing_id
  AND status = 'PENDING';
```

---

### PENDING → REJECTED
**Trigger:** Admin rejects listing  
**Conditions:**
- Listing is in PENDING status
- Admin provides rejection reason

**Actions:**
1. Update `listing.status = 'REJECTED'`
2. Set `listing.rejectionReason`
3. Send SMS to tenant with reason
4. Optional: Allow re-submission (user edits and resubmits)

---

### ACTIVE → UNLOCKED
**Trigger:** Incoming tenant unlocks contact  
**Conditions:**
- Listing is ACTIVE
- User has sufficient credits
- User has not already unlocked this listing

**Actions:**
1. Re-check listing availability inside the transaction
2. Deduct credits atomically
3. Create `Unlock` record
4. Increment `listing.unlockCount`
5. Send SMS to outgoing tenant: "Someone unlocked your listing!"
6. Return contact info to incoming tenant
7. Keep browse visibility explicit on the listing record instead of overloading listing status

---

### UNLOCKED → CONFIRMED
**Trigger:** Both parties confirm connection  
**Conditions:**
- Both `outgoing_tenant` and `incoming_tenant` have confirmed
- No dispute is currently `OPEN` or `INVESTIGATING`

**Actions:**
1. Create or upsert the `Commission` record for the unlock
2. Set `commission.eligibleAt = latest_confirmation_time + 7 days`
3. Set `commission.status = 'PENDING'`
4. Send SMS to both parties: "Connection confirmed! Commission pending."

---

### CONFIRMED → COMPLETED
**Trigger:** Commission is paid  
**Conditions:**
- 7 days have passed since confirmation
- M-Pesa B2C payment succeeded

**Actions:**
1. Update `commission.status = 'PAID'`
2. Set `commission.paidAt = now()`
3. Send SMS to outgoing tenant: "Commission paid!"

---

### ACTIVE/UNLOCKED → DELETED
**Trigger:** User deletes listing  
**Conditions:**
- User is the listing owner
- Every non-refunded unlock is already fully confirmed
- No unlock on the listing has a dispute still `OPEN` or `INVESTIGATING`

**Actions:**
1. Update `listing.isDeleted = true`
2. Set `listing.deletedAt = now()`
3. Invalidate cache
4. Schedule hard delete after 90 days

---

## 1.3 Edge Case Handling

### Edge Case 1: User Deletes Listing After Unlock (Before Confirmation)

**Scenario:** Incoming tenant unlocked, but outgoing tenant deletes listing before confirming

**Resolution:**
1. **Prevent deletion:** Return error "Cannot delete a listing with unresolved unlock activity"
2. **User must:** Reach both confirmations or wait for refund or dispute resolution
3. **If legitimate:** Admin can resolve the dispute and either issue a full refund or restore commission eligibility

---

### Edge Case 2: Listing Edited After Unlock

**Scenario:** Outgoing tenant edits rent amount after unlock

**Resolution:**
1. **Lock critical fields** after first unlock:
   - `monthlyRent` (cannot change)
   - `address` (cannot change)
   - `GPS coordinates` (cannot change)
2. **Allow edits** to non-critical fields:
   - `description` (can update)
   - `propertyNotes` (can update)

**Implementation:**
```typescript
async update(listingId: string, userId: string, dto: UpdateListingDto) {
  const listing = await this.prisma.listing.findUnique({
    where: { id: listingId },
    include: { unlocks: true },
  });

  if (listing.unlockCount > 0) {
    // Listing has been unlocked - restrict edits
    const allowedFields = ['description', 'propertyNotes', 'availableTo'];
    const requestedFields = Object.keys(dto);
    const forbidden = requestedFields.filter(f => !allowedFields.includes(f));
    
    if (forbidden.length > 0) {
      throw new ForbiddenException(
        `Cannot edit ${forbidden.join(', ')} after unlock. Contact support.`
      );
    }
  }

  // Proceed with update...
}
```

---

# 2. CREDIT TRANSACTION WORKFLOW

## 2.1 Purchase Flow (M-Pesa STK Push)

```
┌────────────┐
│   User     │
└─────┬──────┘
      │ 1. POST /credits/purchase
      │    { package: "5_credits", phone: "+254..." }
      ▼
┌─────────────────────────────────────┐
│  Backend                            │
│  ┌────────────────────────────────┐ │
│  │ 1. Validate request            │ │
│  │ 2. Create pending transaction  │ │──▶ Database
│  │ 3. Call M-Pesa STK Push API    │ │
│  └────────────────────────────────┘ │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────┐
│  M-Pesa (Safaricom)     │
│  ┌────────────────────┐ │
│  │ Send STK prompt    │ │──▶ User's phone
│  │ to user's phone    │ │
│  └────────────────────┘ │
└─────────────┬───────────┘
              │
              ▼
┌──────────────────┐
│ User's Phone     │
│ "Enter M-Pesa PIN"│
└────────┬─────────┘
         │ User enters PIN
         ▼
┌─────────────────────────┐
│  M-Pesa Processing      │
│  (10-30 seconds)        │
└────────┬────────────────┘
         │
         │ Callback
         ▼
┌─────────────────────────────────────┐
│  Backend Webhook                    │
│  POST /api/v1/payments/mpesa-callback  │
│  ┌────────────────────────────────┐ │
│  │ 1. Verify signature            │ │
│  │ 2. Check idempotency           │ │
│  │ 3. BEGIN TRANSACTION           │ │
│  │ 4. Add credits                 │ │──▶ Database
│  │ 5. Update transaction status   │ │
│  │ 6. COMMIT                      │ │
│  └────────────────────────────────┘ │
└─────────────┬───────────────────────┘
              │
              ├──▶ Invalidate cache
              │
              ├──▶ Queue SMS job
              │
              └──▶ WebSocket push
                    ▼
              ┌────────────────┐
              │ User sees      │
              │ "5,000 credits │
              │  added!"       │
              └────────────────┘
```

---

## 2.2 State Machine: Credit Transaction

### States
1. **PENDING** - Waiting for M-Pesa payment
2. **COMPLETED** - Payment successful, credits added
3. **FAILED** - Payment failed (insufficient funds, timeout)
4. **CANCELLED** - User cancelled payment
5. **REFUNDED** - Transaction was refunded

### Transitions

#### PENDING → COMPLETED
**Trigger:** M-Pesa callback with `ResultCode = 0`  
**Actions:**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Check idempotency
  const existing = await tx.creditTransaction.findUnique({
    where: { mpesaTransactionId: callback.TransactionID },
  });
  
  if (existing) {
    return { status: 'already_processed' };
  }
  
  // 2. Add credits
  await tx.credit.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      lifetimeEarned: { increment: amount },
    },
  });
  
  // 3. Update transaction
  await tx.creditTransaction.update({
    where: { id: transactionId },
    data: {
      status: 'COMPLETED',
      mpesaReceiptNumber: callback.MpesaReceiptNumber,
      mpesaTransactionId: callback.TransactionID,
    },
  });
});
```

---

#### PENDING → FAILED
**Trigger:** M-Pesa callback with `ResultCode != 0`  
**Reason Codes:**
- `1`: Insufficient funds
- `2032`: Request cancelled by user
- `2001`: Wrong PIN
- `2006`: Generic error

**Actions:**
```typescript
await prisma.creditTransaction.update({
  where: { id: transactionId },
  data: {
    status: 'FAILED',
    metadata: {
      errorCode: callback.ResultCode,
      errorMessage: callback.ResultDesc,
    },
  },
});

// Send SMS
await sms.send(
  user.phoneNumber,
  `Payment failed: ${callback.ResultDesc}. Please try again.`
);
```

---

#### PENDING → CANCELLED
**Trigger:** User cancels M-Pesa prompt  
**Actions:**
- Update status to CANCELLED
- Send notification (optional)
- Allow retry

---

#### COMPLETED → REFUNDED
**Trigger:** Admin manually refunds transaction  
**Conditions:**
- Transaction is COMPLETED
- User requested refund (e.g., accidental purchase)
- Admin approves refund

**Actions:**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Deduct credits
  await tx.credit.update({
    where: { userId },
    data: {
      balance: { decrement: amount },
      lifetimeSpent: { increment: amount },
    },
  });
  
  // 2. Create refund transaction
  await tx.creditTransaction.create({
    data: {
      userId,
      type: 'REFUND',
      amount: -amount,
      status: 'COMPLETED',
      description: `Refund for transaction ${originalTxId}`,
    },
  });
  
  // 3. Update original transaction
  await tx.creditTransaction.update({
    where: { id: originalTxId },
    data: { status: 'REFUNDED' },
  });
});
```

---

## 2.3 Timeout Handling

**Problem:** M-Pesa callback might never arrive (network issues, system downtime)

**Solution: Reconciliation Job**

```typescript
@Cron('*/5 * * * *') // Every 5 minutes
async reconcilePendingTransactions() {
  // Find transactions pending >5 minutes
  const stale = await this.prisma.creditTransaction.findMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: new Date(Date.now() - 5 * 60 * 1000),
      },
    },
  });

  for (const tx of stale) {
    try {
      // Query M-Pesa STK status using the stored checkout request id
      const status = await this.mpesa.queryStkPush({
        checkoutRequestId: tx.mpesaTransactionId,
      });

      if (status.resultCode === 0) {
        // Success - process as completed
        await this.processSuccessfulPayment(tx, status);
      } else {
        // Failed - mark as failed
        await this.processFailedPayment(tx, status);
      }
    } catch (error) {
      this.logger.error(`Reconciliation failed for ${tx.id}:`, error);
    }
  }
}
```

---

# 3. UNLOCK & CONFIRMATION WORKFLOW

## 3.1 Complete Flow

```
┌──────────────┐
│ Incoming     │
│ Tenant       │
│ (Buyer)      │
└──────┬───────┘
       │ 1. Browse listings
       ▼
┌──────────────────┐
│ View listing     │ FREE
│ - All photos     │
│ - Video          │
│ - Description    │
└──────┬───────────┘
       │ 2. Click "Unlock Contact"
       ▼
┌──────────────────┐
│ Check balance    │
│ Required: 2,500  │
│ Current: 5,000   │
└──────┬───────────┘
       │ Sufficient ✓
       ▼
┌─────────────────────────────┐
│ ATOMIC TRANSACTION          │
│ ┌─────────────────────────┐ │
│ │ 1. Deduct 2,500 credits │ │
│ │ 2. Create unlock record │ │
│ │ 3. Update listing count │ │
│ │ COMMIT                  │ │
│ └─────────────────────────┘ │
└──────┬──────────────────────┘
       │
       ├──▶ SMS to outgoing tenant
       │    "Someone unlocked your listing!"
       │
       └──▶ Return contact info
             ▼
       ┌────────────────────┐
       │ Contact Revealed:  │
       │ - Phone: +254...   │
       │ - Address: 123 ... │
       │ - GPS: -1.28, 36.8 │
       └─────┬──────────────┘
             │
             │ 3. Both parties communicate
             │    (via phone/WhatsApp)
             ▼
       ┌────────────────────┐
       │ Incoming tenant    │
       │ confirms:          │
       │ "I'm moving in"    │
       └─────┬──────────────┘
             │
             ▼
       ┌────────────────────┐
       │ Outgoing tenant    │
       │ confirms:          │
       │ "I'm moving out"   │
       └─────┬──────────────┘
             │
             │ Both confirmed ✓
             ▼
       ┌────────────────────┐
       │ Commission Created │
       │ Amount: 750 KES    │
       │ Eligible: +7 days  │
       │ Status: PENDING    │
       └─────┬──────────────┘
             │
             │ 7 days pass
             ▼
       ┌────────────────────┐
       │ Cron Job (9 AM)    │
       │ Pays commission    │
       │ via M-Pesa B2C     │
       └─────┬──────────────┘
             │
             ▼
       ┌────────────────────┐
       │ Outgoing tenant    │
       │ receives 750 KES   │
       │ in M-Pesa          │
       └────────────────────┘
```

---

## 3.2 Confirmation State Machine

### States
1. **UNLOCKED** - Contact revealed, waiting for confirmations
2. **INCOMING_CONFIRMED** - Incoming tenant confirmed, waiting for outgoing
3. **OUTGOING_CONFIRMED** - Outgoing tenant confirmed, waiting for incoming
4. **BOTH_CONFIRMED** - Both confirmed, commission pending
5. **DISPUTED** - Dispute filed, under review
6. **REFUNDED** - Unlock was refunded

---

### Transition: UNLOCKED → INCOMING_CONFIRMED

**Trigger:** Incoming tenant confirms  
**API Call:** `POST /confirmations`
```json
{
  "unlockId": "unlock_123",
  "side": "incoming_tenant"
}
```

**Actions:**
```typescript
async confirmUnlock(unlockId: string, userId: string, side: ConfirmationSide) {
  // 1. Verify user is authorized
  const unlock = await this.prisma.unlock.findUnique({
    where: { id: unlockId },
    include: { listing: true },
  });

  if (side === 'incoming_tenant' && unlock.buyerId !== userId) {
    throw new ForbiddenException('You are not the buyer');
  }

  if (side === 'outgoing_tenant' && unlock.listing.userId !== userId) {
    throw new ForbiddenException('You are not the seller');
  }

  // 2. Check if already confirmed
  const existing = await this.prisma.confirmation.findUnique({
    where: {
      unlockId_side: {
        unlockId,
        side,
      },
    },
  });

  if (existing) {
    return { message: 'Already confirmed', bothConfirmed: false };
  }

  // 3. Create confirmation
  await this.prisma.confirmation.create({
    data: {
      unlockId,
      userId,
      side,
    },
  });

  // 4. Check if both confirmed
  const confirmations = await this.prisma.confirmation.findMany({
    where: { unlockId },
  });

  if (confirmations.length === 2) {
    // Both confirmed!
    return await this.handleBothConfirmed(unlock);
  }

  return {
    message: `Confirmed. Waiting for other party.`,
    bothConfirmed: false,
  };
}
```

---

### Transition: INCOMING_CONFIRMED + OUTGOING_CONFIRMED → BOTH_CONFIRMED

**Trigger:** Second party confirms  
**Actions:**
```typescript
async handleBothConfirmed(unlock: Unlock) {
  await this.prisma.$transaction(async (tx) => {
    // 1. Create or upsert the commission record for the unlock
    const latestConfirmation = await tx.confirmation.aggregate({
      where: { unlockId: unlock.id },
      _max: { confirmedAt: true },
    });
    const confirmedAt = latestConfirmation._max.confirmedAt ?? new Date();

    const commission = await tx.commission.upsert({
      where: { unlockId: unlock.id },
      update: {},
      create: {
        unlockId: unlock.id,
        outgoingTenantId: unlock.listing.userId,
        amountKES: unlock.listing.commission,
        status: 'PENDING',
        eligibleAt: new Date(
          confirmedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    // 2. Send SMS to both parties
    await this.sms.send(
      unlock.buyer.phoneNumber,
      `Connection confirmed! Enjoy your new home in ${unlock.listing.neighborhood}!`
    );

    await this.sms.send(
      unlock.listing.user.phoneNumber,
      `Connection confirmed! You'll receive ${commission.amountKES} KES on ${commission.eligibleAt.toDateString()}.`
    );
  });

  return {
    message: 'Both parties confirmed! Commission pending.',
    bothConfirmed: true,
  };
}
```

---

## 3.3 Edge Cases: Confirmation Flow

### Edge Case 1: One Party Confirms, Other Never Does

**Problem:** Incoming tenant confirms, but outgoing tenant disappears

**Solution 1: Auto-Confirmation After 14 Days**
```typescript
@Cron('0 2 * * *') // Daily at 2 AM
async autoConfirmStaleUnlocks() {
  const staleUnlocks = await this.prisma.unlock.findMany({
    where: {
      isRefunded: false,
      confirmations: {
        some: {
          confirmedAt: {
            lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days
          },
        },
      },
    },
    include: {
      confirmations: true,
      dispute: true,
      listing: true,
    },
  });

  for (const unlock of staleUnlocks) {
    const blockedByDispute =
      unlock.dispute &&
      ['OPEN', 'INVESTIGATING'].includes(unlock.dispute.status);

    if (unlock.confirmations.length === 1 && !blockedByDispute) {
      // One party confirmed 14 days ago, auto-confirm for the other
      const confirmedSide = unlock.confirmations[0].side;
      const otherSide = confirmedSide === 'incoming_tenant'
        ? 'outgoing_tenant'
        : 'incoming_tenant';
      const attributedUserId = otherSide === 'incoming_tenant'
        ? unlock.buyerId
        : unlock.listing.userId;

      await this.confirmUnlock(unlock.id, attributedUserId, otherSide);
      
      this.logger.log(`Auto-confirmed unlock ${unlock.id} for ${otherSide}`);
    }
  }
}
```

**Solution 2: Dispute Mechanism**
- If incoming tenant moves in but outgoing tenant won't confirm
- Incoming tenant can file dispute with proof (photos of lease, receipts)
- Admin reviews and manually confirms

---

### Edge Case 2: Incoming Tenant Confirms, Then Landlord Rejects Them

**Problem:** 
1. Incoming tenant unlocks contact
2. Incoming tenant confirms "I'm moving in"
3. Landlord rejects incoming tenant (e.g., failed background check)
4. Incoming tenant wasted credits

**Solution: Refund Policy**
```typescript
async handleLandlordRejection(unlockId: string, rejectionReason: string) {
  const unlock = await this.prisma.unlock.findUnique({
    where: { id: unlockId },
    include: {
      listing: true,
      buyer: true,
      creditTransaction: true,
    },
  });

  // Only refund if landlord rejected AFTER incoming tenant confirmed
  const incomingConfirmation = await this.prisma.confirmation.findUnique({
    where: {
      unlockId_side: {
        unlockId,
        side: 'incoming_tenant',
      },
    },
  });

  if (incomingConfirmation) {
    // Incoming tenant confirmed, so they deserve refund
    await this.refundUnlock(unlock, rejectionReason);
  } else {
    // Incoming tenant never confirmed, no refund
    return { message: 'No refund - tenant never confirmed' };
  }
}

async refundUnlock(unlock: Unlock, reason: string) {
  await this.prisma.$transaction(async (tx) => {
    // 1. Add credits back
    await tx.credit.update({
      where: { userId: unlock.buyerId },
      data: { balance: { increment: unlock.creditsSpent } },
    });

    // 2. Create refund transaction
    await tx.creditTransaction.create({
      data: {
        userId: unlock.buyerId,
        type: 'REFUND',
        amount: unlock.creditsSpent,
        status: 'COMPLETED',
        description: `Refund: ${reason}`,
      },
    });

    // 3. Mark unlock as refunded
    await tx.unlock.update({
      where: { id: unlock.id },
      data: {
        isRefunded: true,
        refundReason: reason,
        refundedAt: new Date(),
      },
    });

    // 4. Send SMS
    await this.sms.send(
      unlock.buyer.phoneNumber,
      `Refunded ${unlock.creditsSpent} credits. Reason: ${reason}`
    );
  });
}
```

---

# 4. COMMISSION PAYOUT WORKFLOW

## 4.1 Commission States

```
┌──────────┐
│ PENDING  │ (Waiting for 7-day confirmation period)
└─────┬────┘
      │ 7 days pass
      ▼
┌──────────┐
│   DUE    │ (Ready to pay)
└─────┬────┘
      │ Cron job processes
      ▼
┌──────────┐
│PROCESSING│ (M-Pesa B2C in progress)
└─────┬────┘
      │
      ├──▶ Success
      │    ▼
      │  ┌──────────┐
      │  │   PAID   │ (Final state)
      │  └──────────┘
      │
      └──▶ Failure (3x retry)
           ▼
         ┌──────────┐
         │  FAILED  │ (Manual intervention)
         └──────────┘
```

---

## 4.2 Daily Payout Job

```typescript
@Cron('0 9 * * *') // Every day at 9 AM EAT
async processCommissionPayouts() {
  this.logger.log('Starting commission payout job...');

  // Fetch commissions that are due
  const dueCommissions = await this.prisma.commission.findMany({
    where: {
      status: 'DUE',
      eligibleAt: { lte: new Date() },
    },
    include: {
      unlock: {
        include: {
          listing: {
            include: { user: true },
          },
        },
      },
    },
    take: 50, // Process max 50 per batch (M-Pesa rate limit)
  });

  this.logger.log(`Found ${dueCommissions.length} commissions to pay`);

  for (const commission of dueCommissions) {
    await this.payCommission(commission);
  }

  this.logger.log('Commission payout job completed');
}

async payCommission(commission: Commission) {
  try {
    // 1. Update to PROCESSING
    await this.prisma.commission.update({
      where: { id: commission.id },
      data: { status: 'PROCESSING' },
    });

    // 2. Call M-Pesa B2C
    const tenant = commission.unlock.listing.user;
    const result = await this.mpesa.b2c(
      tenant.phoneNumber,
      commission.amountKES,
    );

    // 3. Update to PAID
    await this.prisma.commission.update({
      where: { id: commission.id },
      data: {
        status: 'PAID',
        mpesaTransactionId: result.ConversationID,
        paidAt: new Date(),
      },
    });

    // 4. Send SMS
    await this.sms.send(
      tenant.phoneNumber,
      `You've received ${commission.amountKES} KES from PataSpace! Check your M-Pesa.`
    );

    this.logger.log(`✓ Paid commission ${commission.id}: ${commission.amountKES} KES`);
  } catch (error) {
    this.logger.error(`✗ Failed to pay commission ${commission.id}:`, error);

    // Update attempts
    const attempts = commission.paymentAttempts + 1;

    await this.prisma.commission.update({
      where: { id: commission.id },
      data: {
        status: attempts >= 3 ? 'FAILED' : 'DUE', // Retry max 3 times
        paymentAttempts: attempts,
        lastAttemptAt: new Date(),
        lastAttemptError: error.message,
      },
    });

    if (attempts >= 3) {
      // Alert admin for manual intervention
      await this.alertAdmin(commission, error);
    }
  }
}
```

**Implementation note:** The shipped payout job claims a `DUE` commission first, then re-reads dispute state before sending B2C. If a dispute became `OPEN` or `INVESTIGATING` after the initial fetch, the commission is returned to `DUE` instead of being paid through the race.

---

## 4.3 Edge Cases: Commission Payout

### Edge Case 1: M-Pesa B2C Fails (Insufficient Funds)

**Problem:** PataSpace account doesn't have enough balance

**Solution:**
1. Mark commission as FAILED
2. Alert admin via SMS + email
3. Admin tops up M-Pesa account
4. Admin manually retries payout via dashboard

**Manual Retry:**
```typescript
async manualRetryCommission(commissionId: string, adminId: string) {
  const commission = await this.prisma.commission.findUnique({
    where: { id: commissionId },
  });

  if (commission.status !== 'FAILED') {
    throw new ForbiddenException('Commission is not in FAILED state');
  }

  // Reset to DUE for next cron job
  await this.prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: 'DUE',
      paymentAttempts: 0,
    },
  });

  // Log admin action
  await this.prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'commission.manual_retry',
      entityType: 'Commission',
      entityId: commissionId,
    },
  });
}
```

---

### Edge Case 2: Tenant Phone Number Changed

**Problem:** Outgoing tenant changed their number after unlocking

**Solution:**
1. M-Pesa B2C fails (invalid number)
2. Commission marked as FAILED
3. Admin contacts tenant via original number
4. Admin updates phone number
5. Admin retries payout

---

### Edge Case 3: Commission Paid, But Tenant Claims They Didn't Receive It

**Problem:** M-Pesa says success, but tenant says no money received

**Solution:**
```typescript
async verifyCommissionPayment(commissionId: string) {
  const commission = await this.prisma.commission.findUnique({
    where: { id: commissionId },
  });

  if (commission.status !== 'PAID') {
    return { status: 'not_paid' };
  }

  // Query M-Pesa for transaction details
  const mpesaStatus = await this.mpesa.queryB2CTransaction(
    commission.mpesaTransactionId,
  );

  return {
    status: 'paid',
    mpesaStatus,
    paidAt: commission.paidAt,
    transactionId: commission.mpesaTransactionId,
    receiptNumber: commission.mpesaReceiptNumber,
  };
}
```

**Steps:**
1. Admin queries M-Pesa transaction status
2. If M-Pesa shows success:
   - Provide tenant with transaction ID + receipt number
   - Tenant should check with Safaricom
3. If M-Pesa shows failure:
   - Retry commission payout
   - Create new M-Pesa B2C request

---

# 5. DISPUTE RESOLUTION WORKFLOW

## 5.1 Dispute States

```
┌──────────┐
│   OPEN   │ (Dispute filed)
└─────┬────┘
      │ Admin investigates
      ▼
┌──────────────┐
│INVESTIGATING │ (Admin reviewing evidence)
└──────┬───────┘
       │
       ├──▶ Admin decides
       │
       ▼
┌──────────────┐
│   RESOLVED   │ (Decision made)
└──────┬───────┘
       │
       │ Both parties accept
       ▼
┌──────────────┐
│   CLOSED     │ (Final state)
└──────────────┘
```

---

## 5.2 Dispute Triggers

### Scenario 1: Landlord Rejected Without Valid Reason

**User Action:** File dispute
```json
POST /disputes
{
  "unlockId": "unlock_123",
  "reason": "Landlord rejected me after I passed background check",
  "evidence": [
    "https://s3.../background_check.pdf",
    "https://s3.../rejection_email.jpg"
  ]
}
```

**Admin Review:**
1. View unlock details
2. View both parties' confirmations
3. Review evidence
4. Contact both parties (phone/SMS)
5. Make decision

**Resolutions:**
- **Full refund:** If landlord clearly violated policy
- **No refund:** If tenant's claim is invalid

---

### Scenario 2: Listing Photos Were Fake

**User Action:** File dispute
```json
{
  "reason": "Photos don't match the actual property. I visited and it's completely different.",
  "evidence": [
    "https://s3.../actual_photo_1.jpg",
    "https://s3.../actual_photo_2.jpg"
  ]
}
```

**Admin Review:**
1. Compare GPS coordinates of uploaded photos vs actual location
2. If GPS coords match but photos are misleading:
   - Ban outgoing tenant
   - Full refund to incoming tenant
   - Remove listing
3. If GPS coords don't match:
   - This should have been caught during listing approval
   - Admin failed - full refund + bonus credits

---

## 5.3 Dispute Resolution Actions

```typescript
async resolveDispute(
  disputeId: string,
  adminId: string,
  action: 'FULL_REFUND' | 'NO_REFUND',
  resolution: string,
) {
  const dispute = await this.prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      unlock: {
        include: {
          buyer: true,
          listing: {
            include: { user: true },
          },
        },
      },
    },
  });

  await this.prisma.$transaction(async (tx) => {
    // 1. Update dispute
    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    // 2. Process refund if applicable
    if (action === 'FULL_REFUND') {
      await this.refundUnlock(dispute.unlock, resolution);
    }

    // 3. Log admin action
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'dispute.resolve',
        entityType: 'Dispute',
        entityId: disputeId,
        metadata: {
          action,
          resolution,
        },
      },
    });

    // 4. Send SMS to both parties
    await this.sms.send(
      dispute.unlock.buyer.phoneNumber,
      `Dispute resolved: ${resolution}`
    );

    await this.sms.send(
      dispute.unlock.listing.user.phoneNumber,
      `Dispute resolved: ${resolution}`
    );
  });
}
```

---

# 6. CLEANUP & MAINTENANCE WORKFLOWS

## 6.1 Hard Delete Old Listings (Cron Job)

```typescript
@Cron('0 3 * * 0') // Every Sunday at 3 AM
async hardDeleteOldListings() {
  this.logger.log('Starting hard delete job...');

  // Find listings soft-deleted >90 days ago
  const oldListings = await this.prisma.listing.findMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      photos: true,
    },
  });

  for (const listing of oldListings) {
    try {
      // 1. Delete photos from S3
      for (const photo of listing.photos) {
        await this.s3.deleteObject(photo.s3Key);
      }

      // 2. Delete video from S3
      if (listing.videoUrl) {
        const videoKey = new URL(listing.videoUrl).pathname.slice(1);
        await this.s3.deleteObject(videoKey);
      }

      // 3. Hard delete from database
      await this.prisma.listing.delete({
        where: { id: listing.id },
      });

      this.logger.log(`Deleted listing ${listing.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete listing ${listing.id}:`, error);
    }
  }

  this.logger.log('Hard delete job completed');
}
```

---

## 6.2 Expire Old OTP Codes

```typescript
@Cron('*/10 * * * *') // Every 10 minutes
async cleanupExpiredOTPs() {
  await this.prisma.oTPCode.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}
```

---

## 6.3 Cleanup Expired Refresh Tokens

```typescript
@Cron('0 4 * * *') // Daily at 4 AM
async cleanupExpiredTokens() {
  await this.prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}
```

---

# 7. SUMMARY: CRITICAL WORKFLOWS

## 7.1 Happy Path (End-to-End)

```
1. Outgoing tenant creates listing (mobile)
   └─▶ Admin reviews (if first 3)
       └─▶ Listing goes ACTIVE

2. Incoming tenant browses & unlocks
   └─▶ Credits deducted (atomic transaction)
       └─▶ Contact info revealed

3. Both parties communicate & move in
   └─▶ Both confirm connection
       └─▶ Commission created (PENDING)

4. 7 days pass
   └─▶ Cron job processes commission
       └─▶ M-Pesa B2C pays outgoing tenant
           └─▶ Commission PAID (completed)
```

**Total Duration:** 2-3 weeks (7 days confirmation + processing time)

---

## 7.2 Edge Case Scenarios Covered

| Scenario | Resolution | Status |
|----------|------------|--------|
| User unlocks twice | Idempotency check, return same contact | ✅ Handled |
| Insufficient credits | Error before deduction, prompt to buy | ✅ Handled |
| M-Pesa callback timeout | Reconciliation job queries status | ✅ Handled |
| One party doesn't confirm | Auto-confirm after 14 days | ✅ Handled |
| Landlord rejects after unlock | Full refund if tenant confirmed | ✅ Handled |
| Commission payout fails | 3x retry, then manual intervention | ✅ Handled |
| Fake photos dispute | Admin reviews, ban + refund | ✅ Handled |
| Tenant phone changed | Manual admin update + retry | ✅ Handled |

---

## 7.3 State Machine Validation

**Key Principles:**
1. **All state transitions are explicit** (no implicit states)
2. **Database is source of truth** (not cache, not memory)
3. **Transactions ensure atomicity** (no partial states)
4. **Idempotency prevents duplicates** (safe to retry)
5. **Audit logs track all changes** (for debugging)

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Production-ready workflow definitions
