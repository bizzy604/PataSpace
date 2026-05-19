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
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-foreground">
              Confirmation checklist
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
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
                className="flex gap-4 border border-border bg-muted p-4 text-sm leading-7 text-muted-foreground"
              >
                <span className="mt-1 flex size-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </span>
                <p>{item}</p>
              </div>
            ))}

            <Button className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              Confirm move-in
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border bg-foreground text-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-background">
              Unlock context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-background/76">
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <ClipboardCheck className="size-4 text-primary" />
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
