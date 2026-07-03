/**
 * Purpose: SMS notifications for confirmation events: nudges the other side
 * to confirm, and announces the scheduled commission once both confirm.
 * Why important: the confirmation loop only closes when both parties act;
 * these nudges are what make signal B and C fire in practice.
 * Used by: ConfirmationService (manual + auto-confirm paths).
 */
import { Injectable } from '@nestjs/common';
import { ConfirmationSide as ContractConfirmationSide } from '@pataspace/contracts';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { UserService } from '../user/user.service';

type ConfirmationParties = {
  listing: {
    neighborhood: string;
    user: {
      phoneNumberEncrypted: string | null;
    };
  };
  buyer: {
    phoneNumberEncrypted: string | null;
  };
};

@Injectable()
export class ConfirmationNotifierService {
  constructor(
    private readonly smsService: SmsService,
    private readonly userService: UserService,
  ) {}

  async sendConfirmationNotifications(
    unlock: ConfirmationParties,
    side: ContractConfirmationSide,
    commission: { amountKES: number; eligibleAt: Date } | null,
  ) {
    const buyerPhoneNumber = this.decryptQuietly(unlock.buyer.phoneNumberEncrypted);
    const outgoingTenantPhoneNumber = this.decryptQuietly(
      unlock.listing.user.phoneNumberEncrypted,
    );

    if (commission) {
      await Promise.all([
        this.sendSmsQuietly(
          buyerPhoneNumber,
          `Connection confirmed on PataSpace for ${unlock.listing.neighborhood}.`,
        ),
        this.sendSmsQuietly(
          outgoingTenantPhoneNumber,
          `Connection confirmed on PataSpace. Your ${commission.amountKES} KES commission is scheduled for ${commission.eligibleAt
            .toISOString()
            .slice(0, 10)}.`,
        ),
      ]);

      return;
    }

    if (side === ContractConfirmationSide.INCOMING_TENANT) {
      await this.sendSmsQuietly(
        outgoingTenantPhoneNumber,
        `Incoming tenant confirmed the unlock for your ${unlock.listing.neighborhood} listing. Please confirm on PataSpace.`,
      );
      return;
    }

    await this.sendSmsQuietly(
      buyerPhoneNumber,
      `Outgoing tenant confirmed the unlock for ${unlock.listing.neighborhood}. Please confirm on PataSpace.`,
    );
  }

  async sendSmsQuietly(phoneNumber: string | null, message: string) {
    if (!phoneNumber) {
      return;
    }
    try {
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }

  private decryptQuietly(phoneNumberEncrypted: string | null): string | null {
    if (!phoneNumberEncrypted) {
      return null;
    }
    try {
      return this.userService.decryptPhoneNumber(phoneNumberEncrypted);
    } catch {
      return null;
    }
  }
}
