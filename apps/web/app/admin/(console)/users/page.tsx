/**
 * Purpose: Admin users route — directory with ban/unban controls.
 * Why important: Entry point for account-level moderation.
 * Used by: /admin/users (inside AdminShell).
 */
import { UsersPanel } from '@/components/admin/users-panel';

export default function AdminUsersPage() {
  return <UsersPanel />;
}
