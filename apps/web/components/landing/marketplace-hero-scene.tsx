import Image from 'next/image';
import { MapPinned, ShieldCheck, Wallet } from 'lucide-react';

const sideCards = [
  {
    title: '2BR Apartment',
    area: 'Westlands',
    price: 'KES 28,000',
    detail: 'Verified media and cleaner handover context.',
    image: '/mock/houses/photo5.jpg',
    className: 'left-0 top-14 hidden w-56 xl:block floating-panel',
    badgeClassName: 'bg-[#67d1e3] text-[#081017]',
  },
  {
    title: 'Garden cottage',
    area: 'Karen',
    price: 'KES 42,000',
    detail: 'Quiet compound and direct outgoing-tenant intro.',
    image: '/mock/houses/photo6.jpg',
    className: 'right-0 top-24 hidden w-56 xl:block floating-panel-delay',
    badgeClassName: 'bg-[#d8f5de] text-[#163326]',
  },
];

export function MarketplaceHeroScene() {
  return (
    <div className="relative min-h-[620px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="spotlight-orb absolute left-8 top-20 h-44 w-44 bg-[#67d1e3]/12" />
        <div className="spotlight-orb absolute right-8 top-28 h-52 w-52 bg-[#28809A]/16" />
      </div>

      <div className="absolute left-3 top-8 hidden w-60 rounded-[28px] border border-separator bg-card/92 p-5 text-left shadow-[0_26px_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/7 dark:shadow-[0_26px_80px_rgba(0,0,0,0.24)] lg:block">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#67d1e3]/14 text-[#67d1e3]">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-foreground-tertiary dark:text-white/40">Trust layer</p>
            <p className="mt-1 font-display text-xl font-semibold tracking-[-0.04em] text-foreground dark:text-white">GPS verified listings</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-foreground-secondary dark:text-white/58">
          Photos, area cues, and unlock rules are visible before the serious spend happens.
        </p>
      </div>

      <div className="absolute right-0 top-4 hidden w-60 rounded-[30px] border border-separator bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,239,231,0.94))] p-5 text-left shadow-[0_26px_80px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(18,24,28,0.96),rgba(10,15,19,0.96))] dark:shadow-[0_26px_80px_rgba(0,0,0,0.28)] xl:block">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#28809A]/10 text-[#67d1e3] dark:bg-white/10">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-foreground-tertiary dark:text-white/40">Wallet ready</p>
            <p className="mt-1 font-display text-xl font-semibold tracking-[-0.04em] text-foreground dark:text-white">KES 6,400 balance</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-foreground-secondary dark:text-white/58">
          Enough credit for multiple serious leads without leaving the browse flow.
        </p>
      </div>

      <div className="relative mx-auto flex max-w-[960px] justify-center pt-10">
        {sideCards.map((card) => (
          <div
            key={card.title}
            className={`absolute overflow-hidden rounded-[30px] border border-separator bg-card/92 shadow-[0_26px_80px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] dark:shadow-[0_26px_80px_rgba(0,0,0,0.24)] ${card.className}`}
          >
            <div className="relative aspect-[4/3]">
              <Image src={card.image} alt={card.title} fill className="object-cover" sizes="224px" />
              <div className="image-scrim absolute inset-0" />
              <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${card.badgeClassName}`}>
                {card.area}
              </div>
            </div>
            <div className="p-4">
              <p className="font-display text-lg font-semibold tracking-[-0.04em] text-foreground dark:text-white">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary dark:text-white/54">{card.detail}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#67d1e3]">{card.price}</p>
                <div className="rounded-full bg-primary px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground">
                  Unlock
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="relative w-full max-w-[620px] rounded-[38px] border border-separator bg-card/92 p-4 shadow-[0_38px_120px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] dark:shadow-[0_38px_120px_rgba(0,0,0,0.3)]">
          <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,#0e1720_0%,#091018_100%)] p-3">
            <div className="rounded-[28px] border border-white/8 bg-white/6 p-3">
              <div className="relative aspect-[16/11] overflow-hidden rounded-[24px]">
                <Image
                  src="/mock/houses/photo1.jpg"
                  alt="Main PataSpace featured listing preview."
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1280px) 620px, (min-width: 768px) 60vw, 100vw"
                />
                <div className="image-scrim absolute inset-0" />
                <div className="absolute left-4 top-4 rounded-full bg-[#67d1e3] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#081017]">
                  Kilimani · verified
                </div>

                <div className="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/10 bg-[#0b1219]/78 p-5 backdrop-blur-xl">
                  <div className="flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/44">
                    <span>3 beds</span>
                    <span>2 baths</span>
                    <span>Walkthrough media</span>
                  </div>
                  <p className="mt-3 font-display text-[1.9rem] font-semibold tracking-[-0.05em] text-white">
                    Sunny 3BR handover near Yaya Centre
                  </p>
                  <p className="mt-2 max-w-[28rem] text-sm leading-6 text-white/62">
                    Enough proof to qualify the property before you reveal the exact address and contact details.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#67d1e3]">KES 25,000</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/36">Unlock fee about KES 2,500</p>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#081017]">
                      Unlock contact
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 left-6 w-56 rounded-[26px] border border-separator bg-card/96 p-4 text-left text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/88 dark:text-[#252525] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#28809A]/12 text-[#28809A]">
                <MapPinned className="size-4" />
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground-tertiary dark:text-[#8D9192]">Location preview</p>
                <p className="mt-1 font-display text-lg font-semibold tracking-[-0.04em]">Kilimani, Nairobi</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground-secondary dark:text-[#667174]">
              Area context stays visible before the full address unlocks.
            </p>
          </div>

          <div className="absolute -bottom-8 right-6 w-52 rounded-[26px] border border-[#67d1e3]/20 bg-[#28809A] p-4 text-left text-white shadow-[0_22px_70px_rgba(40,128,154,0.34)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/68">What the renter gets</p>
            <p className="mt-2 font-display text-xl font-semibold tracking-[-0.04em]">Photos, rent, neighborhood, proof</p>
            <p className="mt-2 text-sm leading-6 text-white/82">Enough clarity to decide whether unlocking is worth it.</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 w-[min(92%,420px)] -translate-x-1/2 translate-y-8 rounded-[22px] border border-[#67d1e3]/18 bg-card/92 px-5 py-4 backdrop-blur-2xl dark:bg-[#28809A]/18">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#67d1e3] text-[#081017]">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-[-0.04em] text-foreground dark:text-white">Commission just cleared</p>
            <p className="mt-1 text-sm text-foreground-secondary dark:text-white/62">KES 750 paid after a confirmed move-in on a KES 25,000 listing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
