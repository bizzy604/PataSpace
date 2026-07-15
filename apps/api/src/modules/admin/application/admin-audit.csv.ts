/**
 * Purpose: Deterministic CSV rendering for exported audit-log records.
 * Why important: CSV assembly is same-input-same-output work; keeping it a pure
 *   function makes escaping (commas, quotes, newlines, JSON payloads) testable
 *   in isolation from the query path.
 * Used by: AdminAuditService.collectCsv.
 */
import { AdminAuditLogRecord } from '@pataspace/contracts';

const COLUMNS = [
  'id',
  'createdAt',
  'action',
  'entityType',
  'entityId',
  'adminId',
  'adminName',
  'ipAddress',
  'oldValue',
  'newValue',
  'metadata',
] as const;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toAuditCsv(records: AdminAuditLogRecord[]): string {
  const header = COLUMNS.join(',');
  const rows = records.map((record) =>
    [
      record.id,
      record.createdAt,
      record.action,
      record.entityType,
      record.entityId,
      record.admin?.id ?? '',
      record.admin ? `${record.admin.firstName} ${record.admin.lastName}`.trim() : '',
      record.ipAddress ?? '',
      record.oldValue ?? null,
      record.newValue ?? null,
      record.metadata ?? null,
    ]
      .map(escapeCell)
      .join(','),
  );
  return [header, ...rows].join('\r\n');
}
