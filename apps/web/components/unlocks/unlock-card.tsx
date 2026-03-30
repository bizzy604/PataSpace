import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel, formatKes } from "@/lib/format";
import { linkButtonVariants } from "@/lib/link-button";
import { MockUnlock } from "@/lib/mock-app-state";
import { MockListing } from "@/lib/mock-listings";

type UnlockCardProps = {
  unlock: MockUnlock;
  listing: MockListing;
};

export function UnlockCard({ unlock, listing }: UnlockCardProps) {
  return (
    <Card className="bg-surface-elevated shadow-soft-md">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-kicker">{listing.neighborhood}</p>
            <CardTitle className="mt-2 text-2xl">{listing.title}</CardTitle>
          </div>
          <Badge variant={unlock.status === "confirmed" ? "secondary" : "outline"}>
            {unlock.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-5 text-sm text-foreground-secondary">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
            {formatKes(listing.monthlyRent)} / month
          </div>
          <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
            Spent {formatKes(unlock.creditsSpent)}
          </div>
          <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
            Unlocked {formatDateLabel(unlock.createdAt)}
          </div>
        </div>
        <div className="rounded-[24px] border border-separator bg-card px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex size-9 items-center justify-center rounded-full bg-accent text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Next step</p>
              <p className="mt-2 leading-6">{unlock.nextStep}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/unlocks/${unlock.unlockId}`} className={linkButtonVariants({ size: "sm" })}>
            View unlocked contact
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={`/unlocks/${unlock.unlockId}/confirm`}
            className={linkButtonVariants({ variant: "outline", size: "sm" })}
          >
            Confirmation
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
