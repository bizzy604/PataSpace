import Link from 'next/link';
import { MessageSquareWarning, ShieldCheck, Wallet2 } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import type { MyUnlockRecord } from '@pataspace/contracts';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { MetricCard } from '@/components/shared/metric-card';
import { UnlocksDataTable } from '@/components/tables/unlocks-data-table';
import { getMyUnlocks } from '@/lib/api/unlocks';
import { linkButtonClass } from '@/lib/link-button';

const EMPTY_PAGINATION = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export default async function Page() {
  const { getToken } = await auth();
  const token = await getToken();

  const response = await getMyUnlocks(token).catch(() => ({
    data: [] as MyUnlockRecord[],
    pagination: EMPTY_PAGINATION,
  }));

  const unlocks = response.data;
  const pending = unlocks.filter((u) => u.status === 'pending_confirmation').length;
  const confirmed = unlocks.filter((u) => u.status === 'confirmed').length;
  const refunded = unlocks.filter((u) => u.status === 'refunded').length;

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
        <UnlocksDataTable data={unlocks} />
      </div>
    </TenantWorkspaceShell>
  );
}
