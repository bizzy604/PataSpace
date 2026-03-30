import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { formatDateLabel } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { getMockUnlockBundle } from '@/lib/mock-app-state';

type UnlockConfirmPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UnlockConfirmPage({ params }: UnlockConfirmPageProps) {
  const { id } = await params;
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { unlock, listing } = bundle;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="Confirmation"
        kicker={listing.title}
        title="Confirm whether the move-in connection happened."
        description="The backend supports explicit confirmation records and commission eligibility only after both sides confirm."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-surface-elevated shadow-soft-md">
          <CardHeader>
            <CardTitle>Current progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-foreground-secondary">
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
              Incoming tenant confirmation: {unlock.myConfirmation ? formatDateLabel(unlock.myConfirmation) : 'Pending'}
            </div>
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
              Outgoing tenant confirmation: {unlock.tenantConfirmation ? formatDateLabel(unlock.tenantConfirmation) : 'Pending'}
            </div>
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
              Status: {unlock.status.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">Incoming tenant action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5 text-sm text-white/78">
            <p>
              Use this route to confirm that the handover connection is real. If something went wrong, file a dispute instead of confirming.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/unlocks" className={linkButtonVariants()}>
                Mark as confirmed
              </Link>
              <Link href={`/unlocks/${unlock.unlockId}/dispute`} className={linkButtonVariants({ variant: 'outline' })}>
                Open dispute
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
