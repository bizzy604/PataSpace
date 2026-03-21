import { DisputeStatus } from '../enums';

export type CreateDisputeRequest = {
  unlockId: string;
  reason: string;
  evidence?: string[];
};

export type DisputeRecord = {
  id: string;
  unlockId: string;
  status: DisputeStatus;
  reason: string;
  evidence: string[];
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
};
