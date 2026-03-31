import { UnlockCard } from '@/components/unlocks/unlock-card';
import { mockUnlocks } from '@/lib/mock-app-state';
import { getMockListingById } from '@/lib/mock-listings';

export default function UnlocksPage() {
  return (
    <section className="bg-[#EDEDED]">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <div className="rounded-[24px] bg-white px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Unlock tracker</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
            Track what you unlocked and what still needs confirmation.
          </h1>
          <p className="mt-4 max-w-[720px] text-base leading-7 text-[#8D9192]">
            This page follows the wireframe status model: contact revealed, confirmation state, and reminder-ready next steps in one place.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {mockUnlocks.map((unlock) => {
            const listing = getMockListingById(unlock.listingId);

            if (!listing) {
              return null;
            }

            return <UnlockCard key={unlock.unlockId} unlock={unlock} listing={listing} />;
          })}
        </div>
      </div>
    </section>
  );
}
