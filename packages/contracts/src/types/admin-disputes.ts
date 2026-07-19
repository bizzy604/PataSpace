/**
 * Purpose: Transport types for the admin dispute queue (GET /admin/disputes).
 * Why important: The console works disputes from this list, then acts through
 *   the existing /disputes/:id/investigate|resolve|close endpoints.
 * Used by: apps/api modules/admin, apps/web /admin/disputes page.
 */
import { DisputeStatus } from '../enums';
import { PaginationMeta } from './common';

export type AdminDisputeSummary = {
  id: string;
  unlockId: string;
  status: DisputeStatus;
  reason: string;
  evidenceCount: number;
  evidence: string[];
  reportedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  listing: {
    id: string;
    county: string;
    neighborhood: string;
  };
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type AdminDisputesResponse = {
  data: AdminDisputeSummary[];
  meta: PaginationMeta;
};
