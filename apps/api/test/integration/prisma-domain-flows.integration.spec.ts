import {
  Role,
  TransactionStatus,
  CommissionStatus,
  TransactionType,
} from '@prisma/client';
import { ConfirmationSide } from '@pataspace/contracts';
import { CreditService } from '../../src/modules/credit/credit.service';
import { PaymentService } from '../../src/modules/payment/payment.service';
import { UnlockService } from '../../src/modules/unlock/unlock.service';
import { ConfirmationService } from '../../src/modules/confirmation/confirmation.service';
import { DisputeService } from '../../src/modules/dispute/dispute.service';
import { approveListing, createListing, createVerifiedUser, seedCredits } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Prisma-backed domain service flows', () => {
  let context: ApiTestContext;
  let creditService: CreditService;
  let paymentService: PaymentService;
  let unlockService: UnlockService;
  let confirmationService: ConfirmationService;
  let disputeService: DisputeService;

  beforeAll(async () => {
    context = await createApiTestContext({
      ipRangePrefix: 64,
    });
    creditService = context.get(CreditService);
    paymentService = context.get(PaymentService);
    unlockService = context.get(UnlockService);
    confirmationService = context.get(ConfirmationService);
    disputeService = context.get(DisputeService);
  });

  afterAll(async () => {
    await context.close();
  });

  it('persists purchase completion and balance history through service calls', async () => {
    const buyer = await createVerifiedUser(context);
    const purchase = await paymentService.createPurchase(buyer.userId, {
      package: '5_credits',
      phoneNumber: buyer.phoneNumber,
    });

    const pendingTransaction = await context.prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: purchase.transactionId,
      },
      select: {
        mpesaTransactionId: true,
        metadata: true,
      },
    });
    const metadata = pendingTransaction.metadata as { merchantRequestId?: string } | null;

    await paymentService.handleMpesaCallback({
      Body: {
        stkCallback: {
          MerchantRequestID: metadata?.merchantRequestId ?? 'merchant_request_1',
          CheckoutRequestID: pendingTransaction.mpesaTransactionId ?? 'checkout_request_1',
          ResultCode: 0,
          ResultDesc: 'Success',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 5000 },
              { Name: 'MpesaReceiptNumber', Value: `PSPACE${Date.now()}` },
              { Name: 'PhoneNumber', Value: Number(buyer.phoneNumber.replace('+', '')) },
            ],
          },
        },
      },
    });

    await expect(creditService.getBalance(buyer.userId)).resolves.toMatchObject({
      balance: 5000,
      lifetimeEarned: 5000,
    });

    const storedTransaction = await context.prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: purchase.transactionId,
      },
      select: {
        status: true,
        balanceAfter: true,
        mpesaReceiptNumber: true,
      },
    });

    expect(storedTransaction.status).toBe(TransactionStatus.COMPLETED);
    expect(storedTransaction.balanceAfter).toBe(5000);
    expect(storedTransaction.mpesaReceiptNumber).toBeTruthy();
  });

  it('persists unlock, commission, dispute, and audit relations through services', async () => {
    const owner = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const buyer = await createVerifiedUser(context);
    const listingResponse = await createListing(context, owner.accessToken, 'integration-phase8', {
      neighborhood: `Integration-${Date.now()}`,
      monthlyRent: 25000,
    });

    expect(listingResponse.status).toBe(201);
    await approveListing(context, admin.accessToken, listingResponse.body.id);
    await seedCredits(context, buyer.userId, 5000);

    const unlockResult = await unlockService.createUnlock(buyer.userId, {
      listingId: listingResponse.body.id,
    });
    expect(unlockResult.created).toBe(true);

    await confirmationService.createConfirmation(buyer.userId, {
      unlockId: unlockResult.payload.unlockId,
      side: ConfirmationSide.INCOMING_TENANT,
    });

    const outgoingConfirmation = await confirmationService.createConfirmation(owner.userId, {
      unlockId: unlockResult.payload.unlockId,
      side: ConfirmationSide.OUTGOING_TENANT,
    });

    expect(outgoingConfirmation.bothConfirmed).toBe(true);

    const commission = await context.prismaService.commission.findUniqueOrThrow({
      where: {
        unlockId: unlockResult.payload.unlockId,
      },
      select: {
        amountKES: true,
        outgoingTenantId: true,
        status: true,
      },
    });

    expect(commission.amountKES).toBe(750);
    expect(commission.outgoingTenantId).toBe(owner.userId);
    expect(commission.status).toBe(CommissionStatus.PENDING);

    const dispute = await disputeService.createDispute(buyer.userId, {
      unlockId: unlockResult.payload.unlockId,
      reason: 'Integration dispute for verification coverage.',
      evidence: ['call-log.png'],
    });

    const disputeRecord = await disputeService.getDispute(
      admin.userId,
      Role.ADMIN,
      dispute.disputeId,
    );

    expect(disputeRecord.status).toBe('OPEN');
    expect(disputeRecord.evidence).toEqual(['call-log.png']);

    const disputeAuditLog = await context.prismaService.auditLog.findFirst({
      where: {
        action: 'dispute.create',
        entityId: dispute.disputeId,
      },
      select: {
        metadata: true,
      },
    });

    expect(disputeAuditLog?.metadata).toMatchObject({
      listingId: listingResponse.body.id,
      unlockId: unlockResult.payload.unlockId,
    });
  });

  it('persists refund side effects and balance restoration through services', async () => {
    const owner = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const buyer = await createVerifiedUser(context);
    const listingResponse = await createListing(context, owner.accessToken, 'integration-refund', {
      neighborhood: `Integration-Refund-${Date.now()}`,
      monthlyRent: 25000,
    });

    expect(listingResponse.status).toBe(201);
    await approveListing(context, admin.accessToken, listingResponse.body.id);
    await seedCredits(context, buyer.userId, 5000);

    const unlockResult = await unlockService.createUnlock(buyer.userId, {
      listingId: listingResponse.body.id,
    });

    await confirmationService.createConfirmation(buyer.userId, {
      unlockId: unlockResult.payload.unlockId,
      side: ConfirmationSide.INCOMING_TENANT,
    });
    await confirmationService.createConfirmation(owner.userId, {
      unlockId: unlockResult.payload.unlockId,
      side: ConfirmationSide.OUTGOING_TENANT,
    });

    await unlockService.refundUnlockById(
      unlockResult.payload.unlockId,
      'Listing invalidated during review follow-up.',
    );

    await expect(creditService.getBalance(buyer.userId)).resolves.toMatchObject({
      balance: 5000,
    });

    const [unlockRecord, spendTransaction, refundTransaction, commission] = await Promise.all([
      context.prismaService.unlock.findUniqueOrThrow({
        where: {
          id: unlockResult.payload.unlockId,
        },
        select: {
          isRefunded: true,
          refundReason: true,
          refundedAt: true,
        },
      }),
      context.prismaService.creditTransaction.findUniqueOrThrow({
        where: {
          unlockId: unlockResult.payload.unlockId,
        },
        select: {
          status: true,
          amount: true,
          balanceAfter: true,
          metadata: true,
        },
      }),
      context.prismaService.creditTransaction.findFirstOrThrow({
        where: {
          userId: buyer.userId,
          type: TransactionType.REFUND,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          status: true,
          amount: true,
          balanceAfter: true,
          metadata: true,
        },
      }),
      context.prismaService.commission.findUniqueOrThrow({
        where: {
          unlockId: unlockResult.payload.unlockId,
        },
        select: {
          status: true,
          lastAttemptError: true,
        },
      }),
    ]);

    expect(unlockRecord).toMatchObject({
      isRefunded: true,
      refundReason: 'Listing invalidated during review follow-up.',
    });
    expect(unlockRecord.refundedAt).toBeTruthy();

    expect(spendTransaction).toMatchObject({
      status: TransactionStatus.REFUNDED,
      amount: -2500,
      balanceAfter: 2500,
    });
    expect(spendTransaction.metadata).toMatchObject({
      refundReason: 'Listing invalidated during review follow-up.',
      refundTransactionId: refundTransaction.id,
    });

    expect(refundTransaction).toMatchObject({
      status: TransactionStatus.COMPLETED,
      amount: 2500,
      balanceAfter: 5000,
    });
    expect(refundTransaction.metadata).toMatchObject({
      listingId: listingResponse.body.id,
      reason: 'Listing invalidated during review follow-up.',
      unlockId: unlockResult.payload.unlockId,
    });

    expect(commission).toMatchObject({
      status: CommissionStatus.CANCELLED,
    });
    expect(commission.lastAttemptError).toContain(
      'Listing invalidated during review follow-up.',
    );
  });

  it('persists concurrent unlock idempotency without double-charging through services', async () => {
    const owner = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const buyer = await createVerifiedUser(context);
    const listingResponse = await createListing(context, owner.accessToken, 'integration-concurrent', {
      neighborhood: `Integration-Concurrent-${Date.now()}`,
      monthlyRent: 25000,
    });

    expect(listingResponse.status).toBe(201);
    await approveListing(context, admin.accessToken, listingResponse.body.id);
    await seedCredits(context, buyer.userId, 7000);

    const [unlockA, unlockB] = await Promise.all([
      unlockService.createUnlock(buyer.userId, {
        listingId: listingResponse.body.id,
      }),
      unlockService.createUnlock(buyer.userId, {
        listingId: listingResponse.body.id,
      }),
    ]);

    expect([unlockA, unlockB].filter((result) => result.created)).toHaveLength(1);
    expect(unlockA.payload.unlockId).toBe(unlockB.payload.unlockId);

    const [unlockRecords, spendTransactions, balance] = await Promise.all([
      context.prismaService.unlock.findMany({
        where: {
          buyerId: buyer.userId,
          listingId: listingResponse.body.id,
        },
        select: {
          id: true,
        },
      }),
      context.prismaService.creditTransaction.findMany({
        where: {
          userId: buyer.userId,
          type: TransactionType.SPEND,
        },
        select: {
          id: true,
          amount: true,
          balanceAfter: true,
        },
      }),
      creditService.getBalance(buyer.userId),
    ]);

    expect(unlockRecords).toHaveLength(1);
    expect(spendTransactions).toHaveLength(1);
    expect(spendTransactions[0]).toMatchObject({
      amount: -2500,
      balanceAfter: 4500,
    });
    expect(balance.balance).toBe(4500);
  });

  it('persists dispute investigation, resolution, closure, and audit history through services', async () => {
    const owner = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const buyer = await createVerifiedUser(context);
    const listingResponse = await createListing(context, owner.accessToken, 'integration-dispute', {
      neighborhood: `Integration-Dispute-${Date.now()}`,
      monthlyRent: 24000,
    });

    expect(listingResponse.status).toBe(201);
    await approveListing(context, admin.accessToken, listingResponse.body.id);
    await seedCredits(context, buyer.userId, 6000);

    const unlockResult = await unlockService.createUnlock(buyer.userId, {
      listingId: listingResponse.body.id,
    });

    await confirmationService.createConfirmation(buyer.userId, {
      unlockId: unlockResult.payload.unlockId,
      side: ConfirmationSide.INCOMING_TENANT,
    });
    await confirmationService.createConfirmation(owner.userId, {
      unlockId: unlockResult.payload.unlockId,
      side: ConfirmationSide.OUTGOING_TENANT,
    });

    const dispute = await disputeService.createDispute(buyer.userId, {
      unlockId: unlockResult.payload.unlockId,
      reason: 'Integration lifecycle dispute that will move through all admin states.',
      evidence: ['https://example.com/evidence/integration-dispute.png'],
    });

    const investigatingDispute = await disputeService.investigateDispute(
      admin.userId,
      dispute.disputeId,
    );
    expect(investigatingDispute.status).toBe('INVESTIGATING');

    const resolvedDispute = await disputeService.resolveDispute(
      admin.userId,
      dispute.disputeId,
      {
        action: 'NO_REFUND',
        resolution: 'No refund is warranted because both parties confirmed the connection.',
      },
    );
    expect(resolvedDispute.status).toBe('RESOLVED');
    expect(resolvedDispute.resolution).toBe(
      'No refund is warranted because both parties confirmed the connection.',
    );

    const closedDispute = await disputeService.closeDispute(admin.userId, dispute.disputeId);
    expect(closedDispute.status).toBe('CLOSED');

    const [storedDispute, disputeAuditTrail, commissionRecords] = await Promise.all([
      context.prismaService.dispute.findUniqueOrThrow({
        where: {
          id: dispute.disputeId,
        },
        select: {
          status: true,
          resolution: true,
          resolvedAt: true,
          resolvedBy: true,
        },
      }),
      context.prismaService.auditLog.findMany({
        where: {
          entityId: dispute.disputeId,
          action: {
            in: [
              'dispute.create',
              'dispute.investigate',
              'dispute.resolve',
              'dispute.close',
            ],
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          action: true,
          metadata: true,
        },
      }),
      context.prismaService.commission.findMany({
        where: {
          unlockId: unlockResult.payload.unlockId,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    expect(storedDispute).toMatchObject({
      status: 'CLOSED',
      resolution: 'No refund is warranted because both parties confirmed the connection.',
      resolvedBy: admin.userId,
    });
    expect(storedDispute.resolvedAt).toBeTruthy();

    expect(disputeAuditTrail.map((entry) => entry.action)).toEqual([
      'dispute.create',
      'dispute.investigate',
      'dispute.resolve',
      'dispute.close',
    ]);
    expect(disputeAuditTrail[2]?.metadata).toMatchObject({
      action: 'NO_REFUND',
      unlockId: unlockResult.payload.unlockId,
    });

    expect(commissionRecords).toHaveLength(1);
    expect(commissionRecords[0]?.status).toBe(CommissionStatus.PENDING);
  });
});
