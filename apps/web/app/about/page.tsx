import Link from 'next/link';
import { Check, Lock, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-[linear-gradient(135deg,#28809A,#1e6377)] text-white">
        <div className="mx-auto max-w-[800px] px-4 py-24 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/72">Trust and verification</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-[-0.05em]">
            Stop wasting time on fake listings
          </h1>
          <p className="mt-6 text-2xl leading-9 text-white/84">
            Average renters lose hours viewing bad properties. PataSpace is built to cut that waste down.
          </p>
          <Link
            href="#verification"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#28809A]"
          >
            Our Solution
          </Link>
        </div>
      </section>

      <section id="verification" className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="rounded-[28px] bg-[#EDEDED] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div
              className="aspect-[4/3] rounded-[22px] bg-cover bg-center"
              style={{ backgroundImage: 'linear-gradient(180deg, rgba(37,37,37,0.08), rgba(37,37,37,0.42)), url(/mock/houses/photo6.jpg)' }}
            />
            <div className="mt-5 rounded-[20px] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Verification layer</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[#252525]">GPS-backed listing evidence</p>
              <p className="mt-3 text-sm leading-6 text-[#8D9192]">
                Location proof, review gates, and a cleaner paid reveal step reduce bad leads before a renter travels.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">How we verify every listing</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
              Verification is part of the product, not a footnote.
            </h2>
            <div className="mt-8 space-y-4">
              {[
                'GPS coordinates stay tied to the listing media and neighborhood context.',
                'Photos must align with the approximate location before the listing earns trust.',
                'First posters go through admin review before repeated listings become easier to publish.',
              ].map((item, index) => (
                <div key={item} className="rounded-[20px] border border-[#EDEDED] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[#28809A] text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="text-base leading-7 text-[#252525]">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#EDEDED]">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
          <div className="max-w-[720px]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">Safety features</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
              Payment, data, and fraud controls stay visible to the renter.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: 'Data Protection',
                body: 'Protected identity and verified sessions keep unlock history tied to the right user.',
                Icon: ShieldCheck,
              },
              {
                title: 'Payment Security',
                body: 'M-Pesa-aligned top-ups make the paid reveal step easier to trust.',
                Icon: Lock,
              },
              {
                title: 'Fraud Prevention',
                body: 'Review gates and evidence checks lower the number of bad listings.',
                Icon: Check,
              },
            ].map(({ title, body, Icon }) => (
              <div key={title} className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#28809A] text-white">
                  <Icon className="size-5" />
                </div>
                <p className="mt-6 font-display text-2xl font-semibold text-[#252525]">{title}</p>
                <p className="mt-4 text-base leading-7 text-[#8D9192]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#252525]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 text-white sm:px-6 md:grid-cols-3">
          {[
            { value: '2,000+', label: 'Listings' },
            { value: '5,000+', label: 'Users' },
            { value: '95%', label: 'Success Rate' },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-display text-6xl font-bold tracking-[-0.05em]">{item.value}</p>
              <p className="mt-3 text-lg text-white/72">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
