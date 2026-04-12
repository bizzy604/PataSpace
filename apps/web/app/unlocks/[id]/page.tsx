import { UnlockDetailPage } from '@/components/unlocks/unlock-detail-page';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UnlockDetailPage id={id} />;
}
