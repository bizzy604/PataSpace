import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <Badge variant="secondary">Registration flow</Badge>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.05em] text-foreground">
          Create your PataSpace account.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-secondary">
          This form matches the documented MVP flow: phone number, password, names,
          then OTP verification.
        </p>
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
          <Button className="w-full">Create account</Button>
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
