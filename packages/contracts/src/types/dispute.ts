import { DisputeStatus } from '../enums';

export type CreateDisputeRequest = {
  unlockId: string;
  reason: string;
  evidence?: string[];
};

export type CreateDisputeResponse = {
  disputeId: string;
  status: DisputeStatus;
  message: string;
  estimatedResolution: string;
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
  refundAmount?: number;
};
