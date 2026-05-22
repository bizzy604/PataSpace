/**
 * Purpose: Unit tests for CommissionCallbackService — happy path, failure
 *   path, unknown commission, and idempotent re-delivery.
 * Why important: Guards the contract that webhook callbacks are idempotent
 *   and transition the Commission row correctly per Daraja ResultCode.
 * Used by: jest runner via apps/api jest config.
 */
import { CommissionStatus } from '@prisma/client';
import { CommissionCallbackService } from './commission-callback.service';

describe('CommissionCallbackService', () => {
  const create = () => {
    const prismaService: any = {
      commission: { findUnique: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: any) => unknown) => {
        const tx = {
          commission: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          auditLog: { create: jest.fn() },
        };
        await callback(tx);
        return tx;
      }),
    };
    const smsService = { sendMessage: jest.fn().mockResolvedValue(undefined) };
    const userService = { decryptPhoneNumber: jest.fn().mockReturnValue('+254700000001') };

    return {
      prismaService,
      smsService,
      userService,
      service: new CommissionCallbackService(
        prismaService as never,
        smsService as never,
        userService as never,
      ),
    };
  };

  const buildPayload = (overrides: Partial<{ resultCode: number; resultParameters: any[] }> = {}) => ({
    Result: {
      ConversationID: 'conv_1',
      OriginatorConversationID: 'pataspace-existing',
      ResultCode: overrides.resultCode ?? 0,
      ResultDesc: 'The transaction has completed successfully.',
      TransactionID: 'RCK123',
      ResultParameters: {
        ResultParameter:
          overrides.resultParameters ?? [
            { Key: 'TransactionReceipt', Value: 'RCK123ABC' },
            { Key: 'ReceiverPartyPublicName', Value: '254700000001 - Alice' },
          ],
      },
    },
  });

  it('marks the matching commission PAID on a ResultCode=0 callback and sends SMS', async () => {
    const { prismaService, service, smsService } = create();
    prismaService.commission.findUnique.mockResolvedValue({
      id: 'commission_1',
      status: CommissionStatus.PROCESSING,
      amountKES: 750,
      unlock: {
        listing: {
          neighborhood: 'Kilimani',
          user: { phoneNumberEncrypted: 'encrypted-phone' },
        },
      },
    });

    const outcome = await service.handleB2CResult(buildPayload());

    expect(outcome).toEqual({ kind: 'paid', commissionId: 'commission_1' });
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000001',
      expect.stringContaining("You've received 750 KES"),
    );
  });

  it('marks the commission FAILED on a non-zero ResultCode', async () => {
    const { prismaService, service, smsService } = create();
    prismaService.commission.findUnique.mockResolvedValue({
      id: 'commission_2',
      status: CommissionStatus.PROCESSING,
      amountKES: 750,
      unlock: {
        listing: {
          neighborhood: 'Westlands',
          user: { phoneNumberEncrypted: 'encrypted-phone' },
        },
      },
    });

    const outcome = await service.handleB2CResult(buildPayload({ resultCode: 2001 }));

    expect(outcome).toEqual({ kind: 'failed', commissionId: 'commission_2' });
    expect(smsService.sendMessage).not.toHaveBeenCalled();
  });

  it('returns unknown_commission when no matching OriginatorConversationID exists', async () => {
    const { prismaService, service } = create();
    prismaService.commission.findUnique.mockResolvedValue(null);

    const outcome = await service.handleB2CResult(buildPayload());

    expect(outcome).toEqual({ kind: 'unknown_commission' });
  });

  it('is idempotent on re-delivery — already-PAID commissions are a no-op', async () => {
    const { prismaService, service, smsService } = create();
    prismaService.commission.findUnique.mockResolvedValue({
      id: 'commission_3',
      status: CommissionStatus.PAID,
      amountKES: 750,
      unlock: {
        listing: {
          neighborhood: 'Kilimani',
          user: { phoneNumberEncrypted: 'encrypted-phone' },
        },
      },
    });

    const outcome = await service.handleB2CResult(buildPayload());

    expect(outcome).toEqual({ kind: 'no_state_change', commissionId: 'commission_3' });
    expect(prismaService.$transaction).not.toHaveBeenCalled();
    expect(smsService.sendMessage).not.toHaveBeenCalled();
  });
});
