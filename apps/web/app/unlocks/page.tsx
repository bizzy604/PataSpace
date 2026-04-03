import Link from 'next/link';
import { MessageSquareWarning, ShieldCheck, Wallet2 } from 'lucide-react';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { MetricCard } from '@/components/shared/metric-card';
import { UnlocksDataTable } from '@/components/tables/unlocks-data-table';
import { mockUnlocks } from '@/lib/mock-app-state';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  const pending = mockUnlocks.filter((unlock) => unlock.status === 'pending_confirmation').length;
  const confirmed = mockUnlocks.filter((unlock) => unlock.status === 'confirmed').length;
  const refunded = mockUnlocks.filter((unlock) => unlock.status === 'refunded').length;

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="My unlocks"
      description="Everything you have paid to reveal, including contact access, pending confirmation, dispute outcomes, and refunded paths."
      actions={
        <>
          <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
            Browse listings
          </Link>
          <Link href="/support" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Get support
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Pending confirmation"
          value={`${pending}`}
          hint="Unlocks where one or both parties still need to confirm the handover."
          Icon={Wallet2}
        />
        <MetricCard
          label="Confirmed"
          value={`${confirmed}`}
          hint="Unlocks that completed the tenant side of the post-contact loop."
          Icon={ShieldCheck}
        />
        <MetricCard
          label="Refund protected"
          value={`${refunded}`}
          hint="Unlocks that moved through dispute and returned credit value."
          Icon={MessageSquareWarning}
        />
      </div>

      <div className="mt-6">
        <UnlocksDataTable data={mockUnlocks} />
      </div>
    </TenantWorkspaceShell>
  );
}
