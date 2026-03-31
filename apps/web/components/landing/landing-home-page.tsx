import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  HousePlus,
  KeyRound,
  MapPinned,
  MessageSquareText,
  PhoneCall,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { MarketplaceHeroScene } from '@/components/landing/marketplace-hero-scene';
import { MarketplacePhoneScene } from '@/components/landing/marketplace-phone-scene';
import { CommissionCalculator } from '@/components/pricing/commission-calculator';
import { neighborhoodSearchCards } from '@/lib/listing-visuals';

const trustPoints = ['GPS verified listings', 'Refund-backed unlocks', 'M-Pesa wallet top-ups'];

const heroStats = [
  { value: '2,400+', label: 'Active listings' },
  { value: 'KES 750', label: 'Typical commission on a KES 25k home' },
  { value: '48 hrs', label: 'Average time to connect' },
];

const problemCards = [
  {
    title: 'Broker fees before value',
    description:
      'Too much of the search starts with paying someone who does not actually live in the unit and cannot answer the details that matter.',
    Icon: Wallet,
  },
  {
    title: 'Photos that collapse on arrival',
    description:
      'Outdated gallery shots and vague neighborhood context turn every viewing into a gamble, not a decision.',
    Icon: Search,
  },
  {
    title: 'Contact chains that go nowhere',
    description:
      'Numbers bounce, caretakers redirect, and good leads cool off before you even confirm whether the place is real.',
    Icon: PhoneCall,
  },
];

const solutionSteps = [
  {
    title: 'Outgoing tenants publish real evidence',
    description: 'Photos, short clips, rent, and GPS-backed media give the next renter context before they spend.',
  },
  {
    title: 'Incoming tenants browse for free',
    description: 'Search by neighborhood first, compare rents, and qualify a listing without committing money on every click.',
  },
  {
    title: 'Unlock reveals the serious lead',
    description: 'When a place looks worth pursuing, the unlock reveals direct contact details and the exact location.',
  },
  {
    title: 'Confirmation keeps the payout honest',
    description: 'The handover flow protects both sides and keeps commission tied to a real move-in outcome.',
  },
];

const outgoingJourney = [
  {
    title: 'Post from the actual house',
    body: 'Capture the gate, rooms, and live move-out condition instead of relying on recycled broker media.',
    Icon: HousePlus,
  },
  {
    title: 'Get notified when someone unlocks',
    body: 'Qualified interest shows up fast, and the conversation starts with someone who already knows what they want to inspect.',
    Icon: MessageSquareText,
  },
  {
    title: 'Confirm the move and earn',
    body: 'Commission stays fixed at 30% of the unlock fee after the connection is confirmed.',
    Icon: CircleDollarSign,
  },
];

const incomingJourney = [
  {
    title: 'Browse without paying upfront',
    body: 'You can compare neighborhoods, rent bands, and media before you decide which listing deserves your spend.',
    Icon: Search,
  },
  {
    title: 'Unlock only the listings that feel real',
    body: 'The reveal gives you the exact location plus the outgoing-tenant and caretaker contact pack.',
    Icon: KeyRound,
  },
  {
    title: 'Visit with stronger context',
    body: 'Instead of guessing, you arrive knowing the rough area, asking better questions, and moving faster.',
    Icon: MapPinned,
  },
];

const pricingExamples = [
  { rent: 'KES 15,000', unlock: 'KES 1,500', commission: 'KES 450' },
  { rent: 'KES 25,000', unlock: 'KES 2,500', commission: 'KES 750' },
  { rent: 'KES 40,000', unlock: 'KES 4,000', commission: 'KES 1,200' },
];

const trustBar = [
  'GPS-verified media',
  'Admin reviewed listings',
  'M-Pesa secure wallet',
  'Refund guarantee',
  'SMS and status updates',
  'Dispute resolution flow',
];

const testimonials = [
  {
    quote:
      'I moved from Mombasa into Kilimani without losing two weekends to fake viewings. The outgoing tenant told me what the photos could not.',
    name: 'Aisha Mwangi',
    detail: 'Incoming tenant, Kilimani',
    initials: 'AM',
  },
  {
    quote:
      'Posting felt risky until the first unlock happened. Two weeks later the payout cleared, and the whole handover felt traceable instead of chaotic.',
    name: 'James Otieno',
    detail: 'Outgoing tenant, Westlands',
    initials: 'JO',
  },
  {
    quote:
      'The best part was the honesty. Water schedule, caretaker response time, actual neighborhood noise. That saved me from making the wrong move.',
    name: 'Faith Njeri',
    detail: 'Incoming tenant, Lavington',
    initials: 'FN',
  },
];

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Browse listings', href: '/listings' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Buy credits', href: '/wallet/buy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About PataSpace', href: '/about' },
      { label: 'Support', href: '/support' },
      { label: 'Profile', href: '/profile' },
      { label: 'Wallet', href: '/wallet' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Unlock history', href: '/unlocks' },
      { label: 'Refund path', href: '/support' },
      { label: 'Confirmation flow', href: '/how-it-works' },
      { label: 'Verification', href: '/about' },
    ],
  },
];

export function LandingHomePage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-separator bg-[linear-gradient(180deg,#f9f3e8_0%,#f4ede2_48%,#efe6da_100%)] dark:border-white/8 dark:bg-[linear-gradient(180deg,#09131a_0%,#0b141a_52%,#081017_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="landing-noise absolute inset-0 opacity-45" />
          <div className="spotlight-orb absolute -left-20 top-16 h-72 w-72 bg-[#28809A]/35" />
          <div className="spotlight-orb absolute right-[-6rem] top-8 h-96 w-96 bg-[#67d1e3]/16" />
          <div className="spotlight-orb absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 bg-[#28809A]/20" />
          <div className="texture-grid absolute inset-x-0 top-0 h-[32rem] opacity-[0.08]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-[1280px] flex-col items-center px-4 pb-20 pt-24 text-center sm:px-6 sm:pb-24 lg:pt-28">
          <div className="inline-flex items-center gap-3 rounded-full border border-separator bg-card/86 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-primary shadow-soft-sm backdrop-blur-xl dark:border-white/12 dark:bg-white/7 dark:text-[#67d1e3]">
            <span className="inline-flex size-2 rounded-full bg-[#67d1e3]" />
            Nairobi&apos;s tenant-to-tenant marketplace
          </div>

          <h1 className="headline-glow mt-8 max-w-[980px] font-display text-5xl font-bold leading-[0.92] tracking-[-0.07em] text-foreground dark:text-white sm:text-6xl lg:text-[92px]">
            Your next home already has a story worth hearing.
          </h1>

          <p className="mt-7 max-w-[760px] text-lg leading-8 text-foreground-secondary dark:text-white/66 sm:text-xl">
            Browse verified listings for free, unlock direct contact only when the place feels real, and move with better
            context from the person who actually lived there.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/listings"
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_18px_48px_rgba(40,128,154,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--hig-color-accent-hover)]"
            >
              Browse listings
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex h-14 items-center justify-center rounded-full border border-separator bg-card px-7 text-sm font-semibold text-foreground transition-colors hover:bg-surface-elevated dark:border-white/18 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
            >
              Post your space
            </Link>
          </div>

          <div className="mt-8 grid w-full max-w-[820px] gap-3 rounded-[30px] border border-separator bg-card/92 p-3 text-left shadow-[0_24px_70px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/12 dark:bg-white/6 dark:shadow-[0_24px_70px_rgba(0,0,0,0.24)] md:grid-cols-[1.1fr_0.9fr_auto]">
            <div className="rounded-[22px] border border-separator bg-surface-elevated px-5 py-4 dark:border-white/10 dark:bg-black/18">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-foreground-tertiary dark:text-white/44">Neighborhood</p>
              <p className="mt-2 text-base font-medium text-foreground dark:text-white">Kilimani</p>
            </div>
            <div className="rounded-[22px] border border-separator bg-surface-elevated px-5 py-4 dark:border-white/10 dark:bg-black/18">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-foreground-tertiary dark:text-white/44">Rent band</p>
              <p className="mt-2 text-base font-medium text-foreground dark:text-white">KES 15k to 30k</p>
            </div>
            <Link
              href="/listings?area=Kilimani"
              className="inline-flex h-full min-h-14 items-center justify-center rounded-[22px] bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--hig-color-accent-hover)]"
            >
              <Search className="mr-2 size-4" />
              Start search
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-foreground-secondary dark:text-white/66">
            {trustPoints.map((item) => (
              <div key={item} className="inline-flex items-center gap-2 rounded-full border border-separator bg-card/92 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#67d1e3]/16 text-[#67d1e3]">
                  <Check className="size-3.5" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 grid w-full max-w-[940px] gap-4 rounded-[32px] border border-separator bg-card/92 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-black/18 sm:grid-cols-3">
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-separator bg-surface-elevated px-5 py-6 text-left dark:border-white/8 dark:bg-white/5">
                <p className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground dark:text-white sm:text-4xl">{item.value}</p>
                <p className="mt-3 max-w-[18rem] text-sm leading-6 text-foreground-secondary dark:text-white/56">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 w-full">
            <MarketplaceHeroScene />
          </div>
        </div>
      </section>

      <section id="problem" className="content-auto border-b border-separator bg-[linear-gradient(180deg,#fffaf2_0%,#f5ede1_100%)] dark:border-white/8 dark:bg-[linear-gradient(180deg,#071017_0%,#0a1218_100%)]">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-[860px] text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary dark:text-[#67d1e3]">Act I - The Problem</p>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-foreground dark:text-white sm:text-5xl">
              House hunting should not feel like paying to discover the truth late.
            </h2>
            <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-white/62">
              The old flow makes renters spend time, energy, and money before they can tell whether the listing is even
              credible. PataSpace flips that order.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {problemCards.map(({ title, description, Icon }) => (
              <article
                key={title}
                className="group rounded-[30px] border border-separator bg-card/92 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_70px_rgba(0,0,0,0.18)]"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#67d1e3]/12 text-[#67d1e3]">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-8 font-display text-[1.75rem] font-semibold tracking-[-0.05em] text-foreground dark:text-white">{title}</h3>
                <p className="mt-4 text-base leading-7 text-foreground-secondary dark:text-white/58">{description}</p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-[760px] rounded-[30px] border border-[#67d1e3]/20 bg-[#28809A]/10 px-8 py-8 text-center backdrop-blur-xl">
            <p className="font-display text-2xl font-medium leading-9 tracking-[-0.03em] text-foreground dark:text-white/86">
              The outgoing tenant usually knows the real details. Water schedule. Caretaker speed. Noise after dark. That
              context should not disappear before the next renter arrives.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="content-auto border-b border-separator bg-[linear-gradient(180deg,#f6efe3_0%,#efe7dc_52%,#f7f2eb_100%)] dark:border-white/8 dark:bg-[linear-gradient(180deg,#0a1218_0%,#09141d_52%,#071017_100%)]">
        <div className="mx-auto grid w-full max-w-[1280px] gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary dark:text-[#67d1e3]">Act II - The Relief</p>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-foreground dark:text-white sm:text-5xl">
              The search gets better when the person inside the house stays in the loop.
            </h2>
            <p className="mt-6 max-w-[38rem] text-lg leading-8 text-foreground-secondary dark:text-white/62">
              PataSpace keeps the browse step free, the unlock step intentional, and the handover step traceable. That is
              what makes the marketplace feel cleaner than the usual broker maze.
            </p>

            <div className="mt-10 space-y-5">
              {solutionSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-[24px] border border-separator bg-card/92 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#67d1e3]/30 bg-[#67d1e3]/10 font-display text-sm font-semibold text-[#67d1e3]">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground dark:text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground-secondary dark:text-white/58">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-12 top-12 h-28 rounded-full bg-[#28809A]/12 blur-3xl dark:bg-[#67d1e3]/18" />
            <MarketplacePhoneScene />
          </div>
        </div>
      </section>

      <section id="journeys" className="content-auto border-b border-separator bg-[linear-gradient(180deg,#fffaf3_0%,#f4ebdf_100%)] dark:border-white/8 dark:bg-[linear-gradient(180deg,#071017_0%,#0a1118_100%)]">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary dark:text-[#67d1e3]">Act III - Two Journeys</p>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-foreground dark:text-white sm:text-5xl">
              One marketplace for the renter searching and the tenant leaving.
            </h2>
            <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-white/62">
              The value is different on each side, but the system stays aligned: better information before unlock, cleaner
              contact after unlock, and a fair payout after confirmation.
            </p>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-2">
            <article className="relative overflow-hidden rounded-[34px] border border-[#67d1e3]/18 bg-[linear-gradient(180deg,rgba(40,128,154,0.12),rgba(255,255,255,0.94))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.12)] sm:p-10 dark:bg-[linear-gradient(180deg,rgba(40,128,154,0.14),rgba(10,17,23,0.92))] dark:shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
              <div className="spotlight-orb absolute -right-12 top-0 h-48 w-48 bg-[#67d1e3]/14 dark:bg-[#67d1e3]/18" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#67d1e3]/20 bg-[#67d1e3]/10 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#67d1e3]">
                  <CircleDollarSign className="size-4" />
                  Outgoing tenant
                </div>
                <h3 className="mt-6 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground dark:text-white sm:text-[2.2rem]">
                  You are leaving. The listing should work for you too.
                </h3>
                <p className="mt-4 max-w-[34rem] text-base leading-7 text-foreground-secondary dark:text-white/62">
                  Instead of handing the story over to a broker, you publish it yourself. When the handover completes, you
                  earn 30% of the unlock fee. A KES 25,000 home pays KES 750.
                </p>

                <div className="mt-8 space-y-4">
                  {outgoingJourney.map(({ title, body, Icon }) => (
                    <div key={title} className="flex gap-4 rounded-[22px] border border-separator bg-surface-elevated p-5 dark:border-white/8 dark:bg-black/18">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#67d1e3]/12 text-[#67d1e3]">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground dark:text-white">{title}</h4>
                        <p className="mt-2 text-sm leading-6 text-foreground-secondary dark:text-white/58">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[24px] border border-[#67d1e3]/18 bg-[#67d1e3]/10 px-5 py-5">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary dark:text-[#c8f4fd]">Example payout</p>
                  <div className="mt-3 flex flex-wrap items-end gap-4">
                    <p className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground dark:text-white">KES 750</p>
                    <p className="pb-1 text-sm text-foreground-secondary dark:text-white/62">30% commission on a KES 2,500 unlock fee</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-[34px] border border-separator bg-card/92 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.12)] sm:p-10 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(10,17,23,0.94))] dark:shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
              <div className="spotlight-orb absolute right-0 top-12 h-40 w-40 bg-[#67d1e3]/10 dark:bg-white/10" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-separator bg-card px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-foreground-secondary dark:border-white/12 dark:bg-white/8 dark:text-white/72">
                  <ShieldCheck className="size-4" />
                  Incoming tenant
                </div>
                <h3 className="mt-6 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground dark:text-white sm:text-[2.2rem]">
                  You are searching. Spend later, qualify earlier.
                </h3>
                <p className="mt-4 max-w-[34rem] text-base leading-7 text-foreground-secondary dark:text-white/62">
                  Browse the proof first. Then unlock only when the listing feels worth pursuing. That keeps the serious
                  leads in focus and the bad ones cheap to ignore.
                </p>

                <div className="mt-8 space-y-4">
                  {incomingJourney.map(({ title, body, Icon }) => (
                    <div key={title} className="flex gap-4 rounded-[22px] border border-separator bg-surface-elevated p-5 dark:border-white/8 dark:bg-white/5">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#28809A]/10 text-primary dark:bg-white/10 dark:text-white">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground dark:text-white">{title}</h4>
                        <p className="mt-2 text-sm leading-6 text-foreground-secondary dark:text-white/58">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-foreground-secondary dark:text-white/66">
                  {['Zero-fee browse', 'Refund-backed reveal', 'Exact address after unlock'].map((item) => (
                    <div key={item} className="inline-flex items-center gap-2 rounded-full border border-separator bg-card px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/10 text-primary dark:bg-white/10 dark:text-white">
                        <Check className="size-3.5" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="content-auto border-b border-separator bg-[linear-gradient(180deg,#f4efe5_0%,#ede4d7_100%)] text-foreground dark:border-white/8 dark:bg-[linear-gradient(180deg,#081017_0%,#101920_100%)] dark:text-white">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[760px]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary">Neighborhood-first browse</p>
              <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-foreground dark:text-white sm:text-5xl">
                Search starts with places renters already ask for by name.
              </h2>
              <p className="mt-5 max-w-[44rem] text-lg leading-8 text-foreground-secondary dark:text-white/62">
                The landing page should push people straight into discovery, not just branding. These neighborhood paths give
                the hero a clear next step.
              </p>
            </div>

            <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Browse every listing
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {neighborhoodSearchCards.map((card) => (
              <Link
                key={card.name}
                href={`/listings?area=${encodeURIComponent(card.name)}`}
                className="group overflow-hidden rounded-[28px] border border-[#d9d0c3] bg-white p-4 shadow-[0_20px_60px_rgba(37,37,37,0.1)] transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-card dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
              >
                <div
                  className="aspect-[4/3] rounded-[20px] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(15,23,26,0.08), rgba(15,23,26,0.55)), url(${card.image})`,
                  }}
                />
                <div className="mt-5">
                  <p className="font-display text-[1.7rem] font-semibold tracking-[-0.05em] text-[#252525] dark:text-white">{card.name}</p>
                  <p className="mt-2 text-sm leading-6 text-[#667174] dark:text-white/62">{card.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Open search
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="content-auto border-b border-separator bg-[linear-gradient(180deg,#fff8ef_0%,#f3e9db_100%)] dark:border-white/8 dark:bg-[linear-gradient(180deg,#071017_0%,#081119_100%)]">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary dark:text-[#67d1e3]">Simple pricing</p>
              <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-foreground dark:text-white sm:text-5xl">
                Unlocks track rent. Commission tracks unlocks. Nothing is buried.
              </h2>
              <p className="mt-6 max-w-[36rem] text-lg leading-8 text-foreground-secondary dark:text-white/62">
                The landing page should make the economics legible at a glance. Incoming tenants pay 10% of monthly rent to
                unlock serious leads. Outgoing tenants earn 30% of that fee after confirmation.
              </p>

              <div className="mt-8 rounded-[28px] border border-[#67d1e3]/18 bg-[#28809A]/10 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#67d1e3]/14 text-[#67d1e3]">
                    <BadgeCheck className="size-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground dark:text-white">
                      Pay only when you want the full contact pack.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-foreground-secondary dark:text-white/62">
                      Every unlock reveals the exact location plus the outgoing-tenant and caretaker details needed to inspect
                      the home properly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {pricingExamples.map((example) => (
                  <div key={example.rent} className="rounded-[24px] border border-separator bg-card/92 p-5 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-foreground-tertiary dark:text-white/44">Monthly rent</p>
                    <p className="mt-3 font-display text-[1.8rem] font-semibold tracking-[-0.05em] text-foreground dark:text-white">{example.rent}</p>
                    <div className="mt-5 border-t border-separator pt-5 dark:border-white/8">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary dark:text-[#67d1e3]">Unlock fee</p>
                      <p className="mt-2 text-lg font-semibold text-foreground dark:text-white">{example.unlock}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-tertiary dark:text-white/42">Commission</p>
                      <p className="mt-2 text-lg font-semibold text-foreground dark:text-white/88">{example.commission}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-separator bg-card/92 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] dark:shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-8">
              <div className="max-w-[42rem]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary dark:text-[#67d1e3]">Commission calculator</p>
                <h3 className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground dark:text-white">
                  Let the landing page teach the payout math.
                </h3>
                <p className="mt-4 text-base leading-7 text-foreground-secondary dark:text-white/62">
                  This stays aligned with the product baseline: unlock fee equals 10% of rent, and outgoing-tenant commission
                  equals 30% of that fee.
                </p>
              </div>
              <div className="mt-8">
                <CommissionCalculator />
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {trustBar.map((item) => (
              <div key={item} className="rounded-[20px] border border-separator bg-card/92 px-4 py-4 text-sm text-foreground-secondary dark:border-white/10 dark:bg-white/5 dark:text-white/72">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="content-auto border-b border-separator bg-[linear-gradient(180deg,#fbf6ee_0%,#efe6d8_100%)] dark:border-white/8 dark:bg-[linear-gradient(180deg,#081119_0%,#060b10_100%)]">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary dark:text-[#67d1e3]">Real stories</p>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-foreground dark:text-white sm:text-5xl">
              The trust signal is not the slogan. It is the outcome.
            </h2>
            <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-white/62">
              Real renters move faster when the listing tells the truth early. Real outgoing tenants engage when the payout
              rule is visible and fair.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-[30px] border border-separator bg-card/92 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-1 text-[#67d1e3]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={`${item.name}-${index}`}>*</span>
                  ))}
                </div>
                <p className="mt-6 text-base leading-8 text-foreground-secondary dark:text-white/74">&quot;{item.quote}&quot;</p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#28809A,#67d1e3)] font-semibold text-white">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground dark:text-white">{item.name}</p>
                    <p className="text-sm text-foreground-tertiary dark:text-white/46">{item.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="post" className="content-auto bg-[linear-gradient(180deg,#f5eee3_0%,#efe5d7_100%)] dark:bg-[linear-gradient(180deg,#060b10_0%,#0b1821_100%)]">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
          <div className="relative overflow-hidden rounded-[38px] border border-[#67d1e3]/18 bg-[linear-gradient(180deg,rgba(40,128,154,0.12),rgba(255,255,255,0.94))] px-6 py-10 text-center shadow-[0_32px_110px_rgba(0,0,0,0.14)] dark:bg-[linear-gradient(180deg,rgba(40,128,154,0.12),rgba(8,17,24,0.92))] dark:shadow-[0_32px_110px_rgba(0,0,0,0.26)] sm:px-10 sm:py-14 lg:px-16 lg:py-16">
            <div className="spotlight-orb absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-[#28809A]/14 dark:bg-[#28809A]/18" />
            <div className="relative mx-auto max-w-[820px]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary dark:text-[#c8f4fd]">Ready when the renter is</p>
              <h2 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-foreground dark:text-white sm:text-5xl lg:text-[3.5rem]">
                Launch the landing page like the product already knows where it is going.
              </h2>
              <p className="mt-6 text-lg leading-8 text-foreground-secondary dark:text-white/66">
                Browse for free, unlock only the listings that feel credible, and publish outgoing-tenant knowledge in a way
                the next renter can actually trust.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/listings"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--hig-color-accent-hover)]"
                >
                  Find a home
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-separator bg-card px-7 text-sm font-semibold text-foreground transition-colors hover:bg-surface-elevated dark:border-white/16 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
                >
                  Post your space
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-foreground-secondary dark:text-white/66">
                {[
                  'Free to browse',
                  'Unlock fee tied to rent',
                  'First-touch trust cues',
                  'Refund-backed disputes',
                ].map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full border border-separator bg-card/92 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/10 text-primary dark:bg-white/10 dark:text-white">
                      <Check className="size-3.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-separator bg-[linear-gradient(180deg,#f8f3ea_0%,#efe5d7_100%)] dark:border-white/8 dark:bg-[#05090d]">
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="max-w-[24rem]">
            <Link href="/" className="inline-flex items-center gap-3 text-foreground dark:text-white">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-sm font-bold tracking-[0.24em] text-background dark:bg-white dark:text-[#081017]">
                PS
              </span>
              <span className="font-display text-2xl font-bold tracking-[-0.04em]">PataSpace</span>
            </Link>
            <p className="mt-5 text-sm leading-7 text-foreground-secondary dark:text-white/48">
              A tenant-to-tenant marketplace for discovering homes with better evidence, clearer economics, and less wasted
              motion between listing and move-in.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-foreground-secondary dark:text-white/52">
              <div className="inline-flex items-center gap-2 rounded-full border border-separator bg-card/92 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <Clock3 className="size-4 text-[#67d1e3]" />
                Faster connections
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-separator bg-card/92 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <MapPinned className="size-4 text-[#67d1e3]" />
                Verified locations
              </div>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground dark:text-white">{column.title}</p>
              <div className="mt-5 space-y-3 text-sm text-foreground-secondary dark:text-white/46">
                {column.links.map((link) => (
                  <Link key={link.label} href={link.href} className="block transition-colors hover:text-primary dark:hover:text-[#67d1e3]">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
