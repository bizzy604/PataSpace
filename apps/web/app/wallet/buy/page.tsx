import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { creditPackages, mockCurrentUser } from '@/lib/mock-app-state';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  const selectedPackage =
    creditPackages.find((pkg) => 'recommended' in pkg && pkg.recommended) ?? creditPackages[0];

  return (
    <TenantWorkspaceShell
      pathname="/wallet/buy"
      title="Buy credits"
      description="Use the wallet funding route to send an M-Pesa STK prompt, increase your browsing runway, and prepare for the next unlock."
      actions={
        <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Back to wallet
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
              Choose a package
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              These package amounts map directly to the mock wallet API state and payment flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {creditPackages.map((pkg) => (
              (() => {
                const isRecommended = 'recommended' in pkg && pkg.recommended;

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-[28px] border p-5 ${isRecommended ? 'border-[#28809A]/24 bg-[#28809A] text-white' : 'border-black/8 bg-[#fbfaf7]'}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {pkg.name}
                    </p>
                    <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em]">
                      {formatKes(pkg.amount)}
                    </p>
                    <p className={`mt-1 text-sm ${isRecommended ? 'text-white/72' : 'text-[#62686a]'}`}>
                      {pkg.credits} credits
                    </p>
                    <p className={`mt-4 text-sm leading-7 ${isRecommended ? 'text-white/80' : 'text-[#62686a]'}`}>
                      {pkg.description}
                    </p>
                  </div>
                );
              })()
            ))}
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
              Checkout summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="space-y-2 text-sm font-medium text-[#252525]">
              Phone number for STK push
              <Input className="h-11 rounded-2xl" defaultValue={mockCurrentUser.phoneNumber} />
            </label>

            <div className="rounded-[28px] border border-black/8 bg-[#252525] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/56">
                Selected package
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em]">
                {selectedPackage.name}
              </p>
              <p className="mt-2 text-sm text-white/72">
                {selectedPackage.credits} credits for {formatKes(selectedPackage.amount)}
              </p>
              <div className="mt-5 rounded-[20px] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-white/76">
                The backend returns a pending purchase record first, then updates the wallet after the M-Pesa callback or reconciliation job succeeds.
              </div>
            </div>

            <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-4 text-sm leading-7 text-[#62686a]">
              <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                <Smartphone className="size-4 text-[#28809A]" />
                Payment flow
              </p>
              <p className="mt-2">1. Send STK push.</p>
              <p>2. Wait for callback or reconciliation.</p>
              <p>3. Refresh the wallet and transaction history.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
                Send M-Pesa prompt
              </Button>
              <Link href="/wallet/processing" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                View processing screen
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}
