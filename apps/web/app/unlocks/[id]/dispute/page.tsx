import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageSquareWarning, ShieldAlert } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { getMockUnlockBundle } from '@/lib/mock-app-state';
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

  const { unlock, listing, dispute } = bundle;

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Dispute or report issue"
      description="File a dispute when the revealed listing context does not match the reality of the handover or the documented evidence."
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
              Dispute form
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Report listing mismatch, access problems, or landlord outcome issues tied to this unlock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Reason category</p>
              <Select defaultValue="listing_mismatch">
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Choose a dispute reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listing_mismatch">Listing did not match the property</SelectItem>
                  <SelectItem value="contact_problem">Contact was unreachable or misleading</SelectItem>
                  <SelectItem value="landlord_outcome">Landlord or handover outcome issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">What happened?</p>
              <Textarea
                className="min-h-36"
                defaultValue={`Issue linked to ${listing.title}. Include what changed from the listing evidence, the tenant conversation, and the timeline.`}
              />
            </div>

            <Button className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              Submit dispute
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border bg-foreground text-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-background">
              Current dispute state
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-background/76">
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <MessageSquareWarning className="size-4 text-primary" />
              {listing.title}
            </p>
            {dispute ? (
              <div className="border border-background/10 bg-background/6 p-4">
                <p className="font-medium text-background">{dispute.status}</p>
                <p className="mt-2">{dispute.reason}</p>
                {dispute.resolution ? <p className="mt-2">{dispute.resolution}</p> : null}
              </div>
            ) : (
              <div className="border border-background/10 bg-background/6 p-4">
                No dispute has been filed yet for this unlock.
              </div>
            )}
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <ShieldAlert className="size-4 text-primary" />
              Admin review path
            </p>
            <p>
              Valid disputes can change the unlock outcome and trigger refunds, which then flow back into the wallet ledger.
            </p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}
