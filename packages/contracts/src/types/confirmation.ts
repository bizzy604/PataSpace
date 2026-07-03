import { CommissionStatus, ConfirmationSide, SuccessFeeStatus } from '../enums';

export type CreateConfirmationRequest = {
  unlockId: string;
  side: ConfirmationSide;
};

export type ConfirmationCommission = {
  amount: number;
  status: CommissionStatus;
  payableOn: string;
};

export type ConfirmationSuccessFee = {
  feeDueKes: number;
  creditsApplied: number;
  cashCollectedKes: number;
  remainingKes: number;
  status: SuccessFeeStatus;
};

export type VacatedListingPrompt = {
  seededFromConfirmationId: string;
  estimatedEarningsKes: number;
  message: string;
};

export type CreateConfirmationResponse = {
  confirmationId: string;
  unlockId: string;
  side: ConfirmationSide;
  confirmedAt: string;
  bothConfirmed: boolean;
  commission?: ConfirmationCommission;
  successFee?: ConfirmationSuccessFee;
  vacatedListingPrompt?: VacatedListingPrompt;
  message: string;
};

export type ConfirmationRecord = CreateConfirmationResponse;

export type SettleSuccessFeeRequest = {
  unlockId: string;
};

export type SettleSuccessFeeResponse = {
  unlockId: string;
  feeDueKes: number;
  creditsApplied: number;
  cashCollectedKes: number;
  remainingKes: number;
  status: SuccessFeeStatus;
  newBalance: number;
  message: string;
};
