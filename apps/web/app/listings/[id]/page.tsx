import { auth } from '@clerk/nextjs/server';
import { ListingDetailPage } from '@/components/listings/listing-detail-page';
import { getListingById } from '@/lib/api/listings';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId, getToken } = await auth();
  const token = userId ? await getToken() : null;

  const listing = await getListingById(id, token).catch(() => null);

  return <ListingDetailPage listing={listing} isAuthenticated={!!userId} />;
}
