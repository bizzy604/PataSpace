/**
 * Purpose: Transport types for the admin support workspace — triage queue,
 *   ticket detail with thread + reporter profile, and the status/priority
 *   action payloads.
 * Why important: The console and API import these so a ticket's shape and its
 *   allowed transitions never drift between the two sides.
 * Used by: apps/api modules/admin, apps/web /admin/support page.
 */
import { SupportTicketPriority, SupportTicketStatus } from '../enums';
import { PaginationMeta } from './common';
import { SupportTicketMessageRecord } from './support';

type SupportReporter = {
  id: string;
  firstName: string;
  lastName: string;
};

export type AdminSupportTicketSummary = {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  reporter: SupportReporter;
  assignedToId: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  relatedUnlockId: string | null;
  createdAt: string;
};

export type AdminSupportTicketsResponse = {
  data: AdminSupportTicketSummary[];
  meta: PaginationMeta;
};

export type AdminSupportTicketDetail = {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedToId: string | null;
  channel: string | null;
  adminNotes: string | null;
  relatedUnlockId: string | null;
  reporter: SupportReporter & { phoneNumber: string | null; createdAt: string };
  messages: SupportTicketMessageRecord[];
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSupportTicketStatusRequest = {
  status: SupportTicketStatus;
};

export type UpdateSupportTicketPriorityRequest = {
  priority: SupportTicketPriority;
};
