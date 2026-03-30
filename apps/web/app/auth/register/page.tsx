import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageIntro } from '@/components/shared/page-intro';
import { linkButtonVariants } from '@/lib/link-button';

export default function RegisterPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <PageIntro
          badge="Register"
          kicker="Account setup"
          title="Create an account before you spend credits on a listing."
          description="The web registration flow mirrors the backend contract: names, phone number, password, and then OTP verification to mint the first session."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[24px] border border-separator bg-surface-elevated px-5 py-5 shadow-soft-sm">
            <Smartphone className="size-5 text-primary" />
            <p className="mt-4 font-semibold text-foreground">OTP next</p>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              Registration hands off to verification immediately so the wallet and unlock flows stay tied to a verified phone number.
            </p>
          </div>
          <div className="rounded-[24px] border border-separator bg-surface-elevated px-5 py-5 shadow-soft-sm">
            <p className="section-kicker">Why it matters</p>
            <p className="mt-3 font-semibold text-foreground">Protect the paid reveal step</p>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              Unlocks, confirmations, and disputes are all attached to the verified user identity.
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-surface-elevated shadow-soft-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>OTP verification will follow after the account is created.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="First name" />
            <Input placeholder="Last name" />
          </div>
          <Input placeholder="+254712345678" />
          <Input type="password" placeholder="SecurePassword123!" />
          <Link href="/auth/verify-otp" className={linkButtonVariants({ fullWidth: true })}>
            Create account
            <ArrowRight className="size-4" />
          </Link>
          <p className="text-sm text-muted-foreground">
            Already registered?{' '}
            <Link href="/auth/sign-in" className="font-semibold text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
