import { ConfirmationSide } from '../enums';

export type CreateConfirmationRequest = {
  unlockId: string;
  side: ConfirmationSide;
};

export type ConfirmationRecord = {
  confirmationId: string;
  unlockId: string;
  side: ConfirmationSide;
  confirmedAt: string;
};
