import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SignInPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <Badge variant="secondary">Web auth flow</Badge>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.05em] text-foreground">
          Sign in to unlock real leads.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-secondary">
          Incoming tenants sign in to unlock listings and track confirmations.
          Outgoing tenants use mobile to create and manage listings.
        </p>
      </div>

      <Card className="bg-surface-elevated shadow-soft-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Phone number plus password for the current MVP auth shape.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="+254712345678" />
          <Input type="password" placeholder="Password" />
          <Button className="w-full">Continue</Button>
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
