/**
 * Purpose: Unit tests for CommissionTimeoutService — requeueing expired
 * payouts, idempotent no-ops on settled rows, and unidentifiable payloads.
 * Why important: a queue timeout must requeue exactly the PROCESSING row it
 * belongs to and never disturb a settlement that already landed.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { CommissionStatus } from '@prisma/client';
import { CommissionTimeoutService } from './commission-timeout.service';

describe('CommissionTimeoutService', () => {
  const create = (claimCount = 1) => {
    const tx = {
      commission: { updateMany: jest.fn().mockResolvedValue({ count: claimCount }) },
      auditLog: { create: jest.fn() },
    };
    const prismaService: any = {
      commission: { findUnique: jest.fn() },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };

    return { prismaService, tx, service: new CommissionTimeoutService(prismaService as never) };
  };

  const payload = (originatorConversationId?: string) => ({
    Result: {
      ...(originatorConversationId ? { OriginatorConversationID: originatorConversationId } : {}),
      ResultDesc: 'The service request timed out.',
    },
  });

  it('requeues the matching PROCESSING commission and writes an audit row', async () => {
    const { prismaService, service, tx } = create();
    prismaService.commission.findUnique.mockResolvedValue({
      id: 'commission_1',
      status: CommissionStatus.PROCESSING,
      amountKES: 750,
    });

    const outcome = await service.handleB2CTimeout(payload('pataspace-existing'));

    expect(outcome).toEqual({ kind: 'requeued', commissionId: 'commission_1' });
    expect(tx.commission.updateMany).toHaveBeenCalledWith({
      where: { id: 'commission_1', status: CommissionStatus.PROCESSING },
      data: expect.objectContaining({ status: CommissionStatus.DUE }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'commission.queue_timeout',
        entityId: 'commission_1',
      }),
    });
  });

  it('is a no-op when the row was already settled (claim loses)', async () => {
    const { prismaService, service, tx } = create(0);
    prismaService.commission.findUnique.mockResolvedValue({
      id: 'commission_2',
      status: CommissionStatus.PAID,
      amountKES: 750,
    });

    const outcome = await service.handleB2CTimeout(payload('pataspace-existing'));

    expect(outcome).toEqual({ kind: 'no_state_change', commissionId: 'commission_2' });
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('ignores payloads without an OriginatorConversationID', async () => {
    const { prismaService, service } = create();

    const outcome = await service.handleB2CTimeout(payload());

    expect(outcome).toEqual({ kind: 'ignored' });
    expect(prismaService.commission.findUnique).not.toHaveBeenCalled();
  });

  it('ignores unknown OriginatorConversationIDs', async () => {
    const { prismaService, service } = create();
    prismaService.commission.findUnique.mockResolvedValue(null);

    const outcome = await service.handleB2CTimeout(payload('pataspace-unknown'));

    expect(outcome).toEqual({ kind: 'ignored' });
  });
});
