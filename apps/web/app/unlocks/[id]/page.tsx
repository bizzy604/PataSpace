/**
 * Purpose: Server route that loads a specific unlock record + its dispute and
 *   renders the tenant-facing detail page.
 * Why important: Fetches the unlock from /unlocks/my-unlocks and, when an
 *   active dispute exists, fetches the full DisputeRecord via /disputes/:id so
 *   the UI can surface OPEN/INVESTIGATING/RESOLVED/CLOSED + refund outcome.
 * Used by: Next.js routing for /unlocks/[id].
 */
import { auth } from '@clerk/nextjs/server';
import type { DisputeRecord, MyUnlockRecord } from '@pataspace/contracts';
import { UnlockDetailPage } from '@/components/unlocks/unlock-detail-page';
import { getListingById } from '@/lib/api/listings';
import { getMyUnlocks } from '@/lib/api/unlocks';
import { getDispute } from '@/lib/api/disputes';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();

  const response = await getMyUnlocks(token, 1, 100).catch(() => ({
    data: [] as MyUnlockRecord[],
    pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
  }));

  const unlock = response.data.find((u) => u.unlockId === id) ?? null;

  let tenantFirstName: string | null = null;
  let dispute: DisputeRecord | null = null;
  if (unlock) {
    const listing = await getListingById(unlock.listing.id, token).catch(() => null);
    tenantFirstName = listing?.tenant.firstName ?? null;
    if (unlock.dispute) {
      dispute = await getDispute(token, unlock.dispute.id).catch(() => null);
    }
  }

  return (
    <UnlockDetailPage
      unlock={unlock}
      tenantFirstName={tenantFirstName}
      dispute={dispute}
    />
  );
}
