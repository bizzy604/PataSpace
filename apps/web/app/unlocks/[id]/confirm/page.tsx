import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { getMockUnlockBundle } from '@/lib/mock-app-state';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { unlock, listing } = bundle;

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Confirm move-in"
      description="Use the confirmation step to document that contact led to a successful housing handover."
      actions={
        <Link href={`/unlocks/${unlock.unlockId}`} className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Back to unlock
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Confirmation checklist
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Confirm only after you have spoken to the outgoing tenant and validated the handover outcome.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'You reached the current tenant on the revealed contact details.',
              'The property details and occupancy context matched what was discussed.',
              'You are ready to confirm the move-in outcome on your side.',
            ].map((item) => (
              <div
                key={item}
                className="flex gap-4 rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4 text-sm leading-7 text-[#4b4f50]"
              >
                <span className="mt-1 flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-4" />
                </span>
                <p>{item}</p>
              </div>
            ))}

            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
              Confirm move-in
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Unlock context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <ClipboardCheck className="size-4 text-[#8ed7e7]" />
              {listing.title}
            </p>
            <p>Unlocked on {formatDateLabel(unlock.createdAt)}</p>
            <p>Your first confirmation was {unlock.myConfirmation ? 'already recorded' : 'not yet recorded'}.</p>
            <p>
              Once both sides confirm, the owner-side commission workflow becomes eligible to continue.
            </p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}
