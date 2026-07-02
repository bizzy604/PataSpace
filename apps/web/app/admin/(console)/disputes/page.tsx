/**
 * Purpose: Admin disputes route — the queue plus investigate/resolve/close.
 * Why important: Entry point for refund decisions and dispute lifecycle work.
 * Used by: /admin/disputes (inside AdminShell).
 */
import { DisputesPanel } from '@/components/admin/disputes-panel';

export default function AdminDisputesPage() {
  return <DisputesPanel />;
}
