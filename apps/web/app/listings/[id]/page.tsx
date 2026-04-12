import { ListingDetailPage } from '@/components/listings/listing-detail-page';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetailPage id={id} />;
}
