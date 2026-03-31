import Link from 'next/link';
import { Check } from 'lucide-react';
import { CommissionCalculator } from '@/components/pricing/commission-calculator';

const packages = [
  {
    name: 'Starter Package',
    badge: 'Popular',
    price: '5,000 KES',
    credits: '5,000 Credits',
    subtext: 'About 2 unlocks',
    bonus: null,
    featured: false,
  },
  {
    name: 'Value Package',
    badge: 'Best Value',
    price: '10,000 KES',
    credits: '10,500 Credits',
    subtext: 'Bonus included for repeat browsing',
    bonus: '+500 bonus credits',
    featured: true,
  },
  {
    name: 'Premium Package',
    badge: null,
    price: '20,000 KES',
    credits: '22,000 Credits',
    subtext: 'Best for high-intent search weeks',
    bonus: '+10% bonus credits',
    featured: false,
  },
];

const exampleRows = [
  ['KES 15,000', 'KES 1,500', 'KES 1,500'],
  ['KES 20,000', 'KES 2,000', 'KES 2,000'],
  ['KES 25,000', 'KES 2,500', 'KES 2,500'],
  ['KES 30,000', 'KES 3,000', 'KES 3,000'],
  ['KES 40,000', 'KES 4,000', 'KES 4,000'],
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      <section className="bg-[#EDEDED]">
        <div className="mx-auto max-w-[1200px] px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">Pricing</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-[-0.05em] text-[#252525]">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-5 text-xl leading-8 text-[#8D9192]">Pay only when you unlock contact.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-3">
          {packages.map((item) => (
            <div
              key={item.name}
              className={`rounded-[24px] border-2 p-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-1 ${
                item.featured ? 'border-[#28809A] bg-white' : 'border-[#EDEDED] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">{item.name}</p>
                  {item.badge ? (
                    <span className="mt-4 inline-flex rounded-full bg-[#28809A] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-8 font-display text-5xl font-bold tracking-[-0.05em] text-[#252525]">{item.price}</p>
              <p className="mt-3 text-xl font-medium text-[#252525]">{item.credits}</p>
              <p className="mt-3 text-base text-[#8D9192]">{item.subtext}</p>
              {item.bonus ? <p className="mt-4 text-sm font-semibold text-[#28809A]">{item.bonus}</p> : null}

              <div className="mt-8 space-y-4">
                {['Unlock contact info', 'Full refund protection', 'Credits never expire'].map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-[#252525]">
                    <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                      <Check className="size-3.5" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/wallet/buy"
                className="mt-10 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#28809A] px-6 text-sm font-semibold text-white"
              >
                Buy Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#EDEDED]">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
          <h2 className="font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
            How Much Will It Cost?
          </h2>
          <div className="mt-10 overflow-hidden rounded-[24px] border border-[#d8d8d8] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-3 bg-[#252525] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
              <span>Listing Price</span>
              <span>Unlock Cost (10%)</span>
              <span className="text-[#67d1e3]">You Pay</span>
            </div>
            {exampleRows.map((row) => (
              <div key={row[0]} className="grid grid-cols-3 border-t border-[#EDEDED] px-6 py-4 text-sm text-[#252525]">
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span className="font-semibold text-[#28809A]">{row[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">For outgoing tenants</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
              Earn when someone moves in through your listing.
            </h2>
            <p className="mt-5 max-w-[520px] text-base leading-8 text-[#8D9192]">
              Commission remains 30% of the unlock fee. The calculator below reflects the exact rule in the product baseline.
            </p>
          </div>
          <CommissionCalculator />
        </div>
      </section>

      <section className="bg-[#252525]">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-16 text-white sm:px-6 md:grid-cols-3">
          {[
            { title: 'M-Pesa ready', body: 'Top-ups and payment confirmation stay aligned with local expectations.' },
            { title: 'Refund guarantee', body: 'Dispute-backed refunds protect the paid reveal step.' },
            { title: 'Trusted unlock flow', body: 'Payment, contact reveal, confirmation, and support stay connected.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[20px] border border-white/10 bg-white/6 p-6">
              <p className="font-display text-2xl font-semibold text-white">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-white/72">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
