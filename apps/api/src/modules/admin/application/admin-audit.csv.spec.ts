/**
 * Purpose: Gate tests for the audit CSV renderer — header, JSON payload
 *   stringify, and escaping of commas, quotes, and newlines.
 * Why important: A broken escape would corrupt every downstream column in an
 *   exported row; this is the deterministic guard for that.
 * Used by: jest runner via apps/api jest config.
 */
import { AdminAuditLogRecord } from '@pataspace/contracts';
import { toAuditCsv } from './admin-audit.csv';

const baseRecord = (overrides: Partial<AdminAuditLogRecord> = {}): AdminAuditLogRecord => ({
  id: 'audit_1',
  action: 'user.ban',
  entityType: 'User',
  entityId: 'user_1',
  admin: { id: 'admin_1', firstName: 'Ada', lastName: 'Njeri' },
  oldValue: { status: 'active' },
  newValue: { status: 'banned' },
  metadata: null,
  ipAddress: '196.201.214.10',
  createdAt: '2026-07-14T09:45:00.000Z',
  ...overrides,
});

describe('toAuditCsv', () => {
  it('emits a header and one CRLF-separated row per record', () => {
    const csv = toAuditCsv([baseRecord()]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe(
      'id,createdAt,action,entityType,entityId,adminId,adminName,ipAddress,oldValue,newValue,metadata',
    );
    expect(row).toContain('audit_1,2026-07-14T09:45:00.000Z,user.ban,User,user_1,admin_1,Ada Njeri');
  });

  it('quotes and stringifies JSON payloads that contain commas', () => {
    const csv = toAuditCsv([
      baseRecord({ newValue: { reason: 'fraud, repeated', status: 'banned' } }),
    ]);
    expect(csv).toContain('"{""reason"":""fraud, repeated"",""status"":""banned""}"');
  });

  it('escapes quotes and newlines in scalar cells', () => {
    const csv = toAuditCsv([
      baseRecord({ oldValue: 'line1\nline2', newValue: 'say "hi"', metadata: null }),
    ]);
    expect(csv).toContain('"line1\nline2"');
    expect(csv).toContain('"say ""hi"""');
  });

  it('renders empty cells for a null admin and null payloads', () => {
    const csv = toAuditCsv([
      baseRecord({ admin: null, oldValue: null, newValue: null, metadata: null, ipAddress: null }),
    ]);
    const row = csv.split('\r\n')[1];
    expect(row).toBe('audit_1,2026-07-14T09:45:00.000Z,user.ban,User,user_1,,,,,,');
  });
});
