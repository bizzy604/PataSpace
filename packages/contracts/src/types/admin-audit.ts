/**
 * Purpose: Transport types for the admin audit-log surface (GET
 *   /admin/audit-logs). CSV export streams text, so it has no JSON type here.
 * Why important: The security console renders a before → after diff from these
 *   rows; web and API import the same shape.
 * Used by: apps/api modules/admin, apps/web /admin/audit-logs page.
 */
import { PaginationMeta } from './common';

export type AdminAuditLogRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
};

export type AdminAuditLogsResponse = {
  data: AdminAuditLogRecord[];
  meta: PaginationMeta;
};

export type AdminAuditLogsQuery = {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  adminUserId?: string;
  from?: string;
  to?: string;
};
