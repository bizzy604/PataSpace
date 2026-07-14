/**
 * Purpose: Admin support route — the triage queue and ticket workspace.
 * Why important: Entry point for working the support backlog; open tickets
 *   become actionable conversations here.
 * Used by: /admin/support (inside AdminShell).
 */
import { SupportWorkspace } from '@/components/admin/support-workspace';

export default function AdminSupportPage() {
  return <SupportWorkspace />;
}
