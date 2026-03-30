import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageIntro } from '@/components/shared/page-intro';
import { linkButtonVariants } from '@/lib/link-button';
import { getMockUnlockBundle } from '@/lib/mock-app-state';

type UnlockDisputePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UnlockDisputePage({ params }: UnlockDisputePageProps) {
  const { id } = await params;
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { unlock, listing, dispute } = bundle;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="Dispute and support"
        kicker={listing.title}
        title="Report a listing issue with the unlock attached."
        description="This route represents the backend dispute creation flow for incoming tenants who need a documented refund review path."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card className="bg-surface-elevated shadow-soft-md">
          <CardHeader>
            <CardTitle>Submit issue details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            <Input placeholder="Short reason e.g. Photos did not match the actual unit" />
            <div className="rounded-[24px] border border-separator bg-fill-soft px-4 py-4 text-sm leading-6 text-foreground-secondary">
              Evidence can include screenshots, visit photos, or written explanation tied to unlock <strong className="text-foreground">{unlock.unlockId}</strong>.
            </div>
            <Link href="/support" className={linkButtonVariants()}>
              Submit dispute
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">Current dispute state</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-white/78">
            {dispute ? (
              <>
                <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                  Status: <strong className="text-white">{dispute.status}</strong>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                  Reason: {dispute.reason}
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                  Resolution: {dispute.resolution}
                </div>
              </>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                No dispute is open for this unlock yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
