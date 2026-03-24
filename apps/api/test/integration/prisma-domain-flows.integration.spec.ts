import { Role, TransactionStatus, CommissionStatus } from '@prisma/client';
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
});
