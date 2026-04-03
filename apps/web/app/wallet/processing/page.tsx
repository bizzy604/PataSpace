import Link from 'next/link';
import { Clock3, CircleCheck, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  return (
    <TenantWorkspaceShell
      pathname="/wallet/buy"
      title="M-Pesa processing"
      description="Pending purchases remain visible until the callback completes or the reconciliation path verifies the transaction."
      actions={
        <Link href="/wallet/buy" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Back to checkout
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Waiting for STK confirmation
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              The purchase record has been created as pending and the mobile prompt has been issued.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'Purchase record created', body: 'Transaction state is stored as PENDING with the package amount and phone number.' },
              { title: 'User prompt issued', body: 'The STK request is on the supplied number and waits for PIN entry on the phone.' },
              { title: 'Reconciliation safety net', body: 'If the callback is slow, the backend checks status again so successful payments still land.' },
            ].map((step, index) => (
              <div
                key={step.title}
                className="flex gap-4 rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4"
              >
                <span className="mt-1 flex size-8 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                  {index < 2 ? <CircleCheck className="size-4" /> : <Clock3 className="size-4" />}
                </span>
                <div>
                  <p className="font-medium text-[#252525]">{step.title}</p>
                  <p className="mt-1 text-sm leading-7 text-[#62686a]">{step.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Pending purchase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/78">
            <p className="inline-flex items-center gap-2">
              <Smartphone className="size-4 text-[#8ed7e7]" />
              Search Sprint package
            </p>
            <p>Amount: {formatKes(1000)}</p>
            <p>Status: Pending callback confirmation</p>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              If the prompt stalls, the transaction history keeps the pending state visible until the system retries or marks the payment as failed.
            </div>
            <Link href="/wallet/success" className={linkButtonClass({ size: 'sm' })}>
              Preview success state
            </Link>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}
