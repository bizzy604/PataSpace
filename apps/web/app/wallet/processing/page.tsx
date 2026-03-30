import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { linkButtonVariants } from '@/lib/link-button';

export default function WalletProcessingPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <PageIntro
        badge="M-Pesa processing"
        kicker="Pending purchase state"
        title="Waiting for the STK push confirmation."
        description="This web screen mirrors the backend's pending purchase state while the callback or reconciliation job finalizes the outcome."
      />

      <Card className="mt-8 bg-[#252525] text-white shadow-soft-lg">
        <CardHeader>
          <div className="flex size-14 items-center justify-center rounded-full bg-white/10 text-[#67d1e3]">
            <LoaderCircle className="size-6 animate-spin" />
          </div>
          <CardTitle className="text-white">Prompt sent to your phone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5 text-sm leading-6 text-white/78">
          <p>Enter your M-Pesa PIN on the phone that received the STK prompt.</p>
          <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
            If the callback is delayed, the backend reconciliation job will check the payment status again instead of leaving the purchase stuck forever.
          </div>
          <Link href="/wallet/success" className={linkButtonVariants()}>
            Simulate success state
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
