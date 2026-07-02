/**
 * Purpose: Admin listings route — moderation queue plus full catalogue CRUD.
 * Why important: Entry point for every listing operation the console offers.
 * Used by: /admin/listings (inside AdminShell).
 */
import { ListingsPanel } from '@/components/admin/listings-panel';

export default function AdminListingsPage() {
  return <ListingsPanel />;
}
