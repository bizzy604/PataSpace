/**
 * Purpose: Admin system-config route — live pricing and incentive knobs.
 * Why important: Entry point for editing runtime pricing; changes take effect
 *   on the next listing snapshot.
 * Used by: /admin/config (inside AdminShell).
 */
import { ConfigPanel } from '@/components/admin/config-panel';

export default function AdminConfigPage() {
  return <ConfigPanel />;
}
