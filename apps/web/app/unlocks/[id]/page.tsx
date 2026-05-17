import { auth } from '@clerk/nextjs/server';
import type { MyUnlockRecord } from '@pataspace/contracts';
import { UnlockDetailPage } from '@/components/unlocks/unlock-detail-page';
import { getListingById } from '@/lib/api/listings';
import { getMyUnlocks } from '@/lib/api/unlocks';

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
  if (unlock) {
    const listing = await getListingById(unlock.listing.id, token).catch(() => null);
    tenantFirstName = listing?.tenant.firstName ?? null;
  }

  return <UnlockDetailPage unlock={unlock} tenantFirstName={tenantFirstName} />;
}
