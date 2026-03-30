import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageIntro } from '@/components/shared/page-intro';
import { linkButtonVariants } from '@/lib/link-button';

export default function SignInPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <PageIntro
          badge="Sign in"
          kicker="Auth flow"
          title="Sign in to unlock real leads and track every follow-through step."
          description="Incoming tenants use the web app to buy credits, reveal contact details, confirm a move, and raise disputes when the evidence and the visit do not match."
        />

        <div className="mt-8 rounded-[28px] border border-separator bg-surface-elevated p-5 shadow-soft-md">
          <div className="flex items-start gap-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Phone-first security</p>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                The backend session model is built around Kenyan phone numbers, OTP verification, and token rotation under `/api/v1/auth`.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-surface-elevated shadow-soft-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Phone number plus password for the current MVP auth shape.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="+254712345678" />
          <Input type="password" placeholder="Password" />
          <Link href="/wallet" className={linkButtonVariants({ fullWidth: true })}>
            Continue
            <ArrowRight className="size-4" />
          </Link>
          <p className="text-sm text-muted-foreground">
            No account yet?{' '}
            <Link href="/auth/register" className="font-semibold text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
