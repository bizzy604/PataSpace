import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPinned, Phone, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { getMockUnlockBundle } from '@/lib/mock-app-state';

type UnlockDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UnlockDetailPage({ params }: UnlockDetailPageProps) {
  const { id } = await params;
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { unlock, listing, dispute } = bundle;
  const contactItems = [
    { label: 'Phone number', value: listing.contactInfo.phoneNumber, Icon: Phone },
    { label: 'Address', value: listing.contactInfo.address, Icon: MapPinned },
    { label: 'Credits spent', value: formatKes(unlock.creditsSpent), Icon: TriangleAlert },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="Contact revealed"
        kicker={listing.title}
        title="Unlocked listing contact details"
        description="This page is the web version of the reveal state after credits are successfully spent."
        actions={
          <>
            <Link href={`/unlocks/${unlock.unlockId}/confirm`} className={linkButtonVariants()}>
              Continue to confirmation
            </Link>
            <Link href={`/unlocks/${unlock.unlockId}/dispute`} className={linkButtonVariants({ variant: 'outline' })}>
              Report an issue
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <Card className="bg-surface-elevated shadow-soft-md">
          <CardHeader>
            <CardTitle>Verified contact pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5 text-sm text-foreground-secondary">
            {contactItems.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-[24px] border border-separator bg-fill-soft px-4 py-4"
              >
                <div className="mt-1 flex size-9 items-center justify-center rounded-full bg-card text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="mt-2 leading-6">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">Unlock status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-white/78">
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
              Status: <strong className="text-white">{unlock.status.replace('_', ' ')}</strong>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
              Unlocked on {formatDateLabel(unlock.createdAt)}
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
              My confirmation: {unlock.myConfirmation ? formatDateLabel(unlock.myConfirmation) : 'Not yet sent'}
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
              Tenant confirmation: {unlock.tenantConfirmation ? formatDateLabel(unlock.tenantConfirmation) : 'Waiting'}
            </div>
            {dispute ? (
              <div className="rounded-[22px] border border-[#67d1e3]/20 bg-[#67d1e3]/10 px-4 py-3">
                Dispute status: {dispute.status}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
