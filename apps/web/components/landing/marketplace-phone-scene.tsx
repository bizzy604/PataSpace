import Image from 'next/image';
import { MapPinned, Search, Unlock } from 'lucide-react';

const listingCards = [
  {
    title: '2BR near Yaya Centre',
    area: 'Kilimani',
    price: 'KES 25,000',
    image: '/mock/houses/photo1.jpg',
  },
  {
    title: 'Bright studio in Westlands',
    area: 'Westlands',
    price: 'KES 18,500',
    image: '/mock/houses/photo5.jpg',
  },
];

export function MarketplacePhoneScene() {
  return (
    <div className="relative mx-auto w-full max-w-[390px]">
      <div className="relative rounded-[42px] border border-separator bg-card/92 p-3 shadow-[0_34px_110px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/12 dark:bg-white/8 dark:shadow-[0_34px_110px_rgba(0,0,0,0.34)]">
        <div className="mx-auto mb-3 h-7 w-28 rounded-full border border-white/8 bg-black/75" />

        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,#0d1620_0%,#081018_100%)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-white">Discover</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/36">Nairobi listings</p>
            </div>
            <div className="rounded-full border border-[#67d1e3]/24 bg-[#67d1e3]/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#67d1e3]">
              Live
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/6 px-4 py-3 text-sm text-white/44">
            <Search className="size-4 text-white/38" />
            Search by neighborhood or rent...
          </div>

          <div className="mt-5 space-y-3">
            {listingCards.map((card, index) => (
              <div key={card.title} className="overflow-hidden rounded-[22px] border border-white/8 bg-white/6">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 24rem, 100vw"
                  />
                  <div className="image-scrim absolute inset-0" />
                  <div className="absolute left-3 top-3 rounded-full bg-[#67d1e3] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#081017]">
                    {card.area}
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-display text-lg font-semibold tracking-[-0.04em] text-white">{card.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#67d1e3]">{card.price}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/34">
                        Unlock fee about {index === 0 ? 'KES 2,500' : 'KES 1,850'}
                      </p>
                    </div>
                    <div className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#081017]">
                      <Unlock className="mr-1.5 size-3.5" />
                      Unlock
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-[22px] border border-white/8 bg-white/5 p-4">
            <div className="relative h-32 rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(103,209,227,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(103,209,227,0.16) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#28809A,#67d1e3)] text-white shadow-[0_0_0_10px_rgba(103,209,227,0.1)]">
                  <MapPinned className="size-5" />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/36">After unlock</p>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Exact location, outgoing-tenant details, and caretaker contact land together in one reveal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
