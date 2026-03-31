import { notFound } from 'next/navigation';
import { ConfirmConnectionForm } from '@/components/unlocks/confirm-connection-form';
import { formatDateLabel } from '@/lib/format';
import { getMockUnlockBundle } from '@/lib/mock-app-state';

type UnlockConfirmPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UnlockConfirmPage({ params }: UnlockConfirmPageProps) {
  const { id } = await params;
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { unlock, listing } = bundle;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        <div className="rounded-[24px] bg-[#EDEDED] px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Step 1 of 2</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
            Confirm Your Connection
          </h1>
          <div className="mt-5 h-2 rounded-full bg-white">
            <div className="h-2 w-1/2 rounded-full bg-[#28809A]" />
          </div>
        </div>

        <div className="mt-6 rounded-[20px] border border-[#EDEDED] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-semibold text-[#252525]">{listing.title}</p>
          <p className="mt-2 text-sm text-[#8D9192]">Unlocked {formatDateLabel(unlock.createdAt)}</p>
        </div>

        <div className="mt-6">
          <ConfirmConnectionForm unlockId={unlock.unlockId} />
        </div>
      </div>
    </section>
  );
}
