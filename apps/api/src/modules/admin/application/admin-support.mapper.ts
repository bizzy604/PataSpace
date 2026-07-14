/**
 * Purpose: Maps SupportTicketMessage rows (with the author's name joined) to
 *   the shared SupportTicketMessageRecord transport shape.
 * Why important: Keeps the thread mapping in one place so the admin detail
 *   view and any future thread reader render messages identically.
 * Used by: AdminSupportService, AdminSupportActionsService.
 */
import { Role } from '@prisma/client';
import {
  Role as ContractRole,
  SupportTicketMessageRecord,
} from '@pataspace/contracts';

type SupportMessageRow = {
  id: string;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: Date;
  author: { firstName: string; lastName: string };
};

export function mapSupportMessage(row: SupportMessageRow): SupportTicketMessageRecord {
  return {
    id: row.id,
    authorId: row.authorId,
    authorRole: row.authorRole as unknown as ContractRole,
    authorName: `${row.author.firstName} ${row.author.lastName}`.trim(),
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapSupportMessages(rows: SupportMessageRow[]): SupportTicketMessageRecord[] {
  return rows.map(mapSupportMessage);
}
