/**
 * Purpose: Admin audit-logs route — the security review surface.
 * Why important: Entry point for inspecting and exporting the admin action
 *   trail (bans, approvals, resolutions, config changes, payouts).
 * Used by: /admin/audit-logs (inside AdminShell).
 */
import { AuditLogsPanel } from '@/components/admin/audit-logs-panel';

export default function AdminAuditLogsPage() {
  return <AuditLogsPanel />;
}
