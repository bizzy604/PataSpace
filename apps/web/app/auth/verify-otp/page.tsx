import Link from 'next/link';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { linkButtonVariants } from '@/lib/link-button';

export default function VerifyOtpPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <PageIntro
          badge="Verify OTP"
          kicker="Phone verification"
          title="Finish account setup with the one-time code."
          description="This screen maps directly to the backend `verify-otp` contract and opens the first authenticated web session after a successful code check."
        />
      </div>

      <Card className="bg-surface-elevated shadow-soft-md">
        <CardHeader>
          <CardTitle>Enter the 6-digit code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-5">
          <p className="text-sm leading-6 text-foreground-secondary">
            Sent to <strong className="text-foreground">+254 712 345 678</strong>
          </p>
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex h-14 items-center justify-center rounded-[18px] border border-separator bg-card text-xl font-semibold text-foreground"
              >
                {index < 3 ? index + 1 : ''}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-foreground-secondary">
            <span>Resend available in 0:45</span>
            <button type="button" className="inline-flex items-center gap-2 font-semibold text-primary">
              <RefreshCw className="size-4" />
              Resend code
            </button>
          </div>
          <Link href="/profile" className={linkButtonVariants({ fullWidth: true })}>
            Verify and continue
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
