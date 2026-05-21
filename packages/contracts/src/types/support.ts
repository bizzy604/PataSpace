/**
 * Purpose: Support-ticket contract types shared between API, mobile, and web.
 * Why important: Drives the tenant-facing support inbox and admin triage view.
 * Used by: apps/api support module, mobile MobileAppProvider support flows,
 *   web /support page.
 */
import type { SupportTicketStatus } from '../enums';

export type CreateSupportTicketRequest = {
  subject: string;
  message: string;
  relatedUnlockId?: string;
};

export type SupportTicketRecord = {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  relatedUnlockId: string | null;
  channel: string | null;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportTicketResponse = SupportTicketRecord;

export type SupportTicketsFilters = {
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
};

export type SupportTicketsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedSupportTicketsResponse = {
  data: SupportTicketRecord[];
  pagination: SupportTicketsPagination;
};
