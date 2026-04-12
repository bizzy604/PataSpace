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
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Dispute form
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Report listing mismatch, access problems, or landlord outcome issues tied to this unlock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#252525]">Reason category</p>
              <Select defaultValue="listing_mismatch">
                <SelectTrigger className="h-11 w-full rounded-2xl">
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
              <p className="text-sm font-medium text-[#252525]">What happened?</p>
              <Textarea
                className="min-h-36 rounded-[24px]"
                defaultValue={`Issue linked to ${listing.title}. Include what changed from the listing evidence, the tenant conversation, and the timeline.`}
              />
            </div>

            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
              Submit dispute
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Current dispute state
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <MessageSquareWarning className="size-4 text-[#8ed7e7]" />
              {listing.title}
            </p>
            {dispute ? (
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <p className="font-medium text-white">{dispute.status}</p>
                <p className="mt-2">{dispute.reason}</p>
                {dispute.resolution ? <p className="mt-2">{dispute.resolution}</p> : null}
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                No dispute has been filed yet for this unlock.
              </div>
            )}
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <ShieldAlert className="size-4 text-[#8ed7e7]" />
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
