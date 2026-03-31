import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Info } from 'lucide-react';
import { formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { mockCreditBalance, mockUnlocks } from '@/lib/mock-app-state';
import { getMockListingById } from '@/lib/mock-listings';

type ListingUnlockPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingUnlockPage({ params }: ListingUnlockPageProps) {
  const { id } = await params;
  const listing = getMockListingById(id);

  if (!listing) {
    notFound();
  }

  const visual = getListingVisual(listing.id);
  const existingUnlock = mockUnlocks.find((unlock) => unlock.listingId === listing.id);
  const newBalance = mockCreditBalance.balance - listing.unlockCostCredits;

  return (
    <section className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#252525]/8 px-4 py-12">
      <div className="w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.2)] sm:p-10">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
          <Check className="size-8" />
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-bold tracking-[-0.04em] text-[#252525]">
          Unlock Contact Information?
        </h1>

        <div className="mt-8 flex items-center gap-4 rounded-[18px] bg-[#EDEDED] p-4">
          <div className="relative h-[60px] w-[60px] overflow-hidden rounded-xl">
            <Image src={visual.hero} alt={visual.alt} fill className="object-cover" sizes="60px" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#252525]">
              {formatKes(listing.monthlyRent)}/mo / {listing.neighborhood}
            </p>
            <p className="mt-1 text-sm text-[#8D9192]">{listing.title}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border border-[#EDEDED] p-5">
          <div className="flex items-center justify-between text-sm text-[#8D9192]">
            <span>Unlock Cost</span>
            <span className="font-semibold text-[#28809A]">{formatKes(listing.unlockCostCredits)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-[#8D9192]">
            <span>Current Balance</span>
            <span>{formatKes(mockCreditBalance.balance)}</span>
          </div>
          <div className="my-4 border-t border-[#EDEDED]" />
          <div className="flex items-center justify-between text-sm text-[#252525]">
            <span>New Balance</span>
            <span className="font-semibold">{formatKes(newBalance)}</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D9192]">What you&apos;ll get</p>
          <div className="mt-4 space-y-3">
            {['Tenant phone number', 'Full address', 'GPS coordinates', 'WhatsApp contact'].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-[#252525]">
                <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                  <Check className="size-3.5" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border-l-4 border-[#28809A] bg-[#28809A]/10 px-4 py-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-4 text-[#28809A]" />
            <p className="text-sm leading-6 text-[#28809A]">Full refund if the landlord rejects you through the documented policy path.</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href={existingUnlock ? `/unlocks/${existingUnlock.unlockId}` : '/auth/sign-in'}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#28809A] text-sm font-semibold text-white"
          >
            Unlock for {formatKes(listing.unlockCostCredits)}
          </Link>
          <Link
            href={`/listings/${listing.id}`}
            className="inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-[#8D9192]"
          >
            Cancel
          </Link>
        </div>
      </div>
    </section>
  );
}
