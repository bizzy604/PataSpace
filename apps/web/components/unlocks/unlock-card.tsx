import Link from 'next/link';
import { Bell, Circle, Phone } from 'lucide-react';
import { formatDateLabel, formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { MockUnlock } from '@/lib/mock-app-state';
import { MockListing } from '@/lib/mock-listings';

type UnlockCardProps = {
  unlock: MockUnlock;
  listing: MockListing;
};

const statusTone = {
  pending_confirmation: 'bg-[#28809A]',
  confirmed: 'bg-emerald-500',
  disputed: 'bg-amber-400',
  refunded: 'bg-[#8D9192]',
};

export function UnlockCard({ unlock, listing }: UnlockCardProps) {
  const visual = getListingVisual(listing.id);

  return (
    <article className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
        <div
          className="min-h-[200px] bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(37,37,37,0.12), rgba(37,37,37,0.36)), url(${visual.hero})` }}
        />

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#8D9192]">{listing.neighborhood}</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">
                {listing.title}
              </h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EDEDED] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#252525]">
              <span className={`inline-flex size-2 rounded-full ${statusTone[unlock.status]}`} />
              {unlock.status.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] bg-[#EDEDED] px-4 py-4 text-sm text-[#252525]">
              {formatKes(listing.monthlyRent)} / month
            </div>
            <div className="rounded-[18px] bg-[#EDEDED] px-4 py-4 text-sm text-[#252525]">
              Spent {formatKes(unlock.creditsSpent)}
            </div>
            <div className="rounded-[18px] bg-[#EDEDED] px-4 py-4 text-sm text-[#252525]">
              Unlocked {formatDateLabel(unlock.createdAt)}
            </div>
          </div>

          <div className="mt-6 rounded-[18px] border border-[#EDEDED] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex size-8 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                <Circle className="size-3 fill-current" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#252525]">Next step</p>
                <p className="mt-2 text-sm leading-6 text-[#8D9192]">{unlock.nextStep}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/unlocks/${unlock.unlockId}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#28809A] px-5 text-sm font-semibold text-white"
            >
              <Phone className="mr-2 size-4" />
              View Contact
            </Link>
            <Link
              href={`/unlocks/${unlock.unlockId}/confirm`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#EDEDED] px-5 text-sm font-semibold text-[#252525]"
            >
              Confirmation
            </Link>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#EDEDED] px-5 text-sm font-semibold text-[#252525]"
            >
              <Bell className="mr-2 size-4 text-[#28809A]" />
              Send Reminder
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
