import { PageIntro } from '@/components/shared/page-intro';
import { UnlockCard } from '@/components/unlocks/unlock-card';
import { mockUnlocks } from '@/lib/mock-app-state';
import { getMockListingById } from '@/lib/mock-listings';

export default function UnlocksPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="My unlocks"
        kicker="Post-unlock workflow"
        title="Track what you revealed, what still needs confirmation, and where disputes exist."
        description="The web unlock hub covers the incoming-tenant state after payment: contact revealed, confirmations, and issue reporting."
      />

      <div className="mt-8 space-y-4">
        {mockUnlocks.map((unlock) => {
          const listing = getMockListingById(unlock.listingId);

          if (!listing) {
            return null;
          }

          return <UnlockCard key={unlock.unlockId} unlock={unlock} listing={listing} />;
        })}
      </div>
    </section>
  );
}
