import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';

export default function WalletSuccessPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <PageIntro
        badge="Payment success"
        kicker="Credits added"
        title="Credits are now available for the next unlock."
        description="This is the post-callback success state for the M-Pesa purchase flow."
      />

      <Card className="mt-8 bg-surface-elevated shadow-soft-md">
        <CardHeader>
          <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <CheckCircle2 className="size-7" />
          </div>
          <CardTitle>Top-up completed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5 text-sm leading-6 text-foreground-secondary">
          <div className="rounded-[24px] border border-separator bg-fill-soft px-4 py-4">
            Added <strong className="text-foreground">{formatKes(2000)}</strong> worth of credits to your balance.
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/wallet" className={linkButtonVariants()}>
              Back to wallet
            </Link>
            <Link href="/listings" className={linkButtonVariants({ variant: 'outline' })}>
              Browse listings
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
