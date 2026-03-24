import { CommissionStatus, ConfirmationSide } from '../enums';

export type CreateConfirmationRequest = {
  unlockId: string;
  side: ConfirmationSide;
};

export type ConfirmationCommission = {
  amount: number;
  status: CommissionStatus;
  payableOn: string;
};

export type CreateConfirmationResponse = {
  confirmationId: string;
  unlockId: string;
  side: ConfirmationSide;
  confirmedAt: string;
  bothConfirmed: boolean;
  commission?: ConfirmationCommission;
  message: string;
};

export type ConfirmationRecord = CreateConfirmationResponse;
