import Link from 'next/link';
import { ArrowRight, Check, Camera, CheckCircle2, MapPinned, Unlock } from 'lucide-react';

const incomingSteps = [
  {
    number: '1',
    title: 'Browse Listings Free',
    description: 'Scan rent, neighborhood, and listing media without paying for every dead end.',
    points: ['Real photos from current tenants', 'Neighborhood-first search', 'Trust cues visible before unlock'],
    image: '/mock/houses/photo1.jpg',
    Icon: MapPinned,
  },
  {
    number: '2',
    title: 'Unlock Contact (10% of rent)',
    description: 'Pay only when the property feels like a serious lead and receive the contact pack immediately.',
    points: ['Phone number and full address', 'GPS coordinates', 'Refund path when evidence fails'],
    image: '/mock/houses/photo5.jpg',
    Icon: Unlock,
  },
  {
    number: '3',
    title: 'Confirm and Move In',
    description: 'The final step tracks whether the handover happened and protects the commission flow.',
    points: ['Move-in confirmation', 'Issue reporting', 'Tracked handover timeline'],
    image: '/mock/houses/photo6.jpg',
    Icon: CheckCircle2,
  },
];

const outgoingSteps = [
  {
    number: '1',
    title: 'Take GPS Photos',
    description: 'Capture the house with location-backed media before you publish it.',
    points: ['Front gate and rooms', 'Move-out context', 'Clear rent and deposit'],
    Icon: Camera,
  },
  {
    number: '2',
    title: 'Listing Goes Live',
    description: 'Once the first review passes, the listing becomes visible to incoming tenants.',
    points: ['Verified presentation on web', 'Trust review for first posters', 'Search visibility'],
    Icon: Unlock,
  },
  {
    number: '3',
    title: 'Earn KES 600',
    description: 'After both sides confirm, the commission pipeline starts and the payout window opens.',
    points: ['Commission based on unlock fee', 'Hold period for disputes', 'Transparent next-step tracking'],
    Icon: CheckCircle2,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-white">
      <section className="bg-[#EDEDED]">
        <div className="mx-auto max-w-[1000px] px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">How it works</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-[-0.05em] text-[#252525]">
            How PataSpace Works
          </h1>
          <p className="mt-5 text-xl leading-8 text-[#8D9192]">Find your next home in 3 simple steps.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1000px] px-4 py-20 sm:px-6">
        <div className="max-w-[720px]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">For incoming tenants</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
            A timeline built around fewer wasted visits.
          </h2>
        </div>

        <div className="mt-12 space-y-8">
          {incomingSteps.map((step) => (
            <div
              key={step.number}
              className="grid overflow-hidden rounded-[24px] border border-[#EDEDED] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] lg:grid-cols-2"
            >
              <div className="p-8 lg:p-10">
                <div className="flex size-20 items-center justify-center rounded-full bg-[#28809A] text-3xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-6 font-display text-[28px] font-bold tracking-[-0.04em] text-[#252525]">
                  {step.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#8D9192]">{step.description}</p>
                <div className="mt-6 space-y-3">
                  {step.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-[#252525]">
                      <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                        <Check className="size-3.5" />
                      </span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="min-h-[320px] bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(180deg, rgba(37,37,37,0.12), rgba(37,37,37,0.28)), url(${step.image})` }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#fafafa]">
        <div className="mx-auto max-w-[1000px] px-4 py-20 sm:px-6">
          <div className="max-w-[720px]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">For outgoing tenants</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
              Publish, verify, and earn when the handover succeeds.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {outgoingSteps.map(({ number, title, description, points, Icon }) => (
              <div key={number} className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#28809A] text-white">
                  <Icon className="size-5" />
                </div>
                <p className="mt-6 font-display text-5xl font-bold tracking-[-0.05em] text-[#28809A]">{number}</p>
                <h3 className="mt-4 font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">{title}</h3>
                <p className="mt-4 text-base leading-7 text-[#8D9192]">{description}</p>
                <div className="mt-6 space-y-3">
                  {points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-[#252525]">
                      <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                        <Check className="size-3.5" />
                      </span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#EDEDED]">
        <div className="mx-auto max-w-[1000px] px-4 py-20 sm:px-6">
          <div className="max-w-[720px]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#28809A]">FAQ</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">
              Questions renters ask before they commit.
            </h2>
          </div>
          <div className="mt-10 divide-y divide-white/80 rounded-[24px] bg-white px-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            {[
              {
                q: 'Why do I pay only at unlock?',
                a: 'Because browsing needs to stay low-friction. PataSpace charges when the listing is serious enough to reveal direct contact.',
              },
              {
                q: 'What if the listing does not match the evidence?',
                a: 'The refund and dispute flow exists for exactly that case. The support path stays attached to the unlock.',
              },
              {
                q: 'How do outgoing tenants earn?',
                a: 'Commission eligibility starts after both sides confirm the handover connection.',
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-display text-lg font-semibold text-[#252525]">
                  {item.q}
                </summary>
                <p className="mt-3 max-w-[760px] text-base leading-7 text-[#8D9192]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#28809A]">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-6 px-4 py-20 text-center text-white sm:px-6">
          <h2 className="font-display text-4xl font-bold tracking-[-0.05em]">Ready to get started?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/listings" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#28809A]">
              I&apos;m Looking
            </Link>
            <Link href="/auth/register" className="inline-flex h-12 items-center justify-center rounded-full border border-white px-6 text-sm font-semibold text-white">
              I&apos;m Leaving
            </Link>
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            Review pricing
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
