'use client';

import Image from 'next/image';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, Check, ClipboardList, Clock3, Moon, Repeat2, RotateCcw, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-owner-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '900'],
  variable: '--font-owner-display',
  display: 'swap',
});

const ownerSansStyle = {
  fontFamily: 'var(--font-owner-sans), sans-serif',
} satisfies CSSProperties;

const noiseStyle = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
} satisfies CSSProperties;

const lightGridStyle = {
  backgroundImage:
    'linear-gradient(rgba(23,23,23,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(23,23,23,0.08) 1px, transparent 1px)',
  backgroundSize: '60px 60px',
  maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
} satisfies CSSProperties;

const darkGridStyle = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '60px 60px',
  maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
} satisfies CSSProperties;

const displayFontClass = '[font-family:var(--font-owner-display)]';
const pageShell = 'mx-auto w-full max-w-[1400px]';
const sectionShell = 'mx-auto max-w-[1400px] px-6 py-20 md:px-10 lg:px-16 lg:py-28';
const sectionTitleClass = cn(
  displayFontClass,
  'text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-[#111111] dark:text-white',
);
const bodyTextClass = 'text-[1.05rem] leading-8 text-[#4e5457] dark:text-white/60';
const cardClass =
  'border border-black/10 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]';

type PainPoint = {
  title: string;
  body: string;
  Icon: typeof Clock3;
};

type ComparisonRow = {
  label: string;
  traditional: string;
  pataspace: string;
  traditionalClassName?: string;
  pataspaceClassName?: string;
};

type Step = {
  number: string;
  title: string;
  body: string;
  tag: string;
};

type FlywheelItem = {
  arrow: string;
  title: string;
  body: string;
  highlight?: boolean;
};

type Benefit = {
  title: string;
  body: string;
};

type ProofStat = {
  value: ReactNode;
  description: string;
};

const painPoints: PainPoint[] = [
  {
    title: 'Average vacancy period in Nairobi: 3-6 weeks',
    body: 'That is lost rent you will never recover, happening silently, every cycle.',
    Icon: Clock3,
  },
  {
    title: "Agents who don't know your property like your tenants do",
    body: 'They post generic descriptions. Your unit becomes one of fifty listings. Serious renters move on.',
    Icon: ClipboardList,
  },
  {
    title: 'This cycle repeats every time a tenant leaves',
    body: 'It is not a one-time problem. It is a structural gap in how property transitions work in Kenya.',
    Icon: Repeat2,
  },
];

const comparisonRows: ComparisonRow[] = [
  {
    label: 'Who advertises your unit',
    traditional: 'A stranger who has never been inside',
    pataspace: 'The tenant who lived there',
    pataspaceClassName: 'text-[#28809A] dark:text-[#67d1e3] font-medium',
  },
  {
    label: 'Who sees the listing',
    traditional: 'Everyone, qualified or not',
    pataspace: 'Renters actively looking, right now',
    pataspaceClassName: 'text-[#28809A] dark:text-[#67d1e3] font-medium',
  },
  {
    label: 'Renter intent',
    traditional: 'Unknown until they call',
    pataspace: 'Verified - they paid credits to unlock your unit',
    pataspaceClassName: 'text-[#28809A] dark:text-[#67d1e3] font-medium',
  },
  {
    label: 'Your cost',
    traditional: 'Commission per let',
    pataspace: 'Zero. Forever.',
    traditionalClassName: 'text-[#d04f4f] dark:text-[#ef7a7a]',
    pataspaceClassName: 'text-[#28809A] dark:text-[#67d1e3] font-medium',
  },
  {
    label: 'Time to first serious inquiry',
    traditional: '1-3 weeks',
    pataspace: 'Days',
    traditionalClassName: 'text-[#d04f4f] dark:text-[#ef7a7a]',
    pataspaceClassName: 'text-[#28809A] dark:text-[#67d1e3] font-medium',
  },
];

const steps: Step[] = [
  {
    number: '01',
    title: 'You give a one-time consent',
    body: 'You authorize PataSpace for your property. That is all you ever do. One decision, one time.',
    tag: 'Property Owner',
  },
  {
    number: '02',
    title: 'Your tenant lists the unit when they leave',
    body: 'They post photos, a description, and the location. Verified renters on PataSpace see it immediately and unlock the contact details using credits.',
    tag: 'Outgoing Tenant',
  },
  {
    number: '03',
    title: 'A verified renter contacts you directly',
    body: 'No agent in the middle. No WhatsApp chains. A renter who has already seen the unit and chosen it reaches your caretaker directly.',
    tag: 'Incoming Tenant',
  },
];

const flywheelItems: FlywheelItem[] = [
  {
    arrow: '->',
    title: 'Landlord consents once',
    body: 'Their property enters the network permanently. No action needed again.',
  },
  {
    arrow: '->',
    title: 'Outgoing tenant lists the unit',
    body: 'Real photos, real details, real GPS. From someone who lived there.',
  },
  {
    arrow: '->',
    title: 'Verified renter unlocks the details',
    body: 'They pay credits to access the landlord contact and exact location.',
  },
  {
    arrow: '->',
    title: 'Outgoing tenant earns M-Pesa commission',
    body: 'The cycle rewards everyone - and makes the next listing even more trusted.',
  },
  {
    arrow: '->>',
    title: '50+ properties already in the network',
    body: 'Every new landlord increases listing density in their area for all renters searching nearby.',
    highlight: true,
  },
];

const benefits: Benefit[] = [
  {
    title: 'Faster tenant transitions',
    body: 'Renters on PataSpace are already looking. Your unit reaches them before it even goes cold.',
  },
  {
    title: 'No agent commissions. No listing fees.',
    body: 'You pay nothing. The platform is funded by renters who unlock unit details - not by you.',
  },
  {
    title: 'Better-informed renters arrive at your door',
    body: "They've seen the GPS location, the photos, the real details. No wasted viewings. No time-wasters.",
  },
  {
    title: 'Your tenants become a community asset',
    body: 'When you onboard your tenants to PataSpace, you give them a tool that earns them M-Pesa commission when they leave. That is a benefit you offer them.',
  },
];

const proofStats: ProofStat[] = [
  {
    value: (
      <>
        50<span className="text-[#28809A] dark:text-[#67d1e3]">+</span>
      </>
    ),
    description: 'Properties already listed on the platform by early partners',
  },
  {
    value: (
      <>
        <span className="text-[#28809A] dark:text-[#67d1e3]">^</span>3x
      </>
    ),
    description: 'Faster to find a tenant compared to traditional agent listings',
  },
  {
    value: (
      <>
        KES <span className="text-[#28809A] dark:text-[#67d1e3]">0</span>
      </>
    ),
    description: 'Total cost paid by any property owner on the platform',
  },
];

const riskReducers = [
  'No subscription required',
  'No agent fees, ever',
  'Cancel consent anytime',
  '15 minutes, no pressure',
];

const areaTags = ['Westlands', 'Kilimani', 'Kasarani', 'Eastlands', '+ surrounding areas'];

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      src="/brand/pataspace-logo.png"
      alt="PataSpace"
      width={compact ? 112 : 144}
      height={compact ? 32 : 40}
      priority
      className={cn(
        'w-auto object-contain',
        compact ? 'h-8 md:h-9' : 'h-9 md:h-10',
        'brightness-95 contrast-125 dark:brightness-105 dark:contrast-110',
      )}
    />
  );
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div data-owner-reveal className={cn('landing-reveal', className)}>{children}</div>;
}

function SectionLabel({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        'mb-5 inline-flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#28809A] dark:text-[#67d1e3]',
        centered && 'justify-center',
      )}
    >
      <span className="h-px w-6 bg-current" />
      {children}
    </div>
  );
}

function Divider() {
  return <hr className="mx-6 border-0 border-t border-black/10 md:mx-10 lg:mx-16 dark:border-white/10" />;
}

export function LandingHomePage() {
  const [isDark, setIsDark] = useState(false);
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('pataspace-landing-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeOverride(savedTheme);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const syncTheme = () => {
      if (themeOverride === 'dark') {
        setIsDark(true);
        return;
      }

      if (themeOverride === 'light') {
        setIsDark(false);
        return;
      }

      const explicitDark = root.classList.contains('dark');
      const explicitLight = root.classList.contains('light');
      setIsDark(explicitDark || (!explicitLight && media.matches));
    };

    syncTheme();

    const mediaListener = () => syncTheme();
    media.addEventListener('change', mediaListener);

    const classObserver = new MutationObserver(() => syncTheme());
    classObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-owner-reveal]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return () => {
        media.removeEventListener('change', mediaListener);
        classObserver.disconnect();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      media.removeEventListener('change', mediaListener);
      classObserver.disconnect();
    };
  }, [themeOverride]);

  useEffect(() => {
    if (themeOverride) {
      window.localStorage.setItem('pataspace-landing-theme', themeOverride);
      return;
    }

    window.localStorage.removeItem('pataspace-landing-theme');
  }, [themeOverride]);

  const toggleTheme = () => {
    setThemeOverride((current) => {
      if (current === 'dark') {
        return 'light';
      }

      if (current === 'light') {
        return 'dark';
      }

      return isDark ? 'light' : 'dark';
    });
  };

  return (
    <div
      id="top"
      className={cn(
        dmSans.variable,
        playfairDisplay.variable,
        isDark && 'dark',
        'relative isolate overflow-x-hidden bg-[#f7f3ea] text-[#171717] transition-colors duration-300 dark:bg-[#0d0d0d] dark:text-white',
      )}
      style={ownerSansStyle}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 dark:hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#faf6ee_0%,#efe6d8_100%)]" />
        <div className="absolute -right-28 -top-20 h-[42rem] w-[42rem] rounded-full bg-[#28809A]/12 blur-[130px]" />
        <div className="absolute left-[-10rem] top-[28rem] h-[26rem] w-[26rem] rounded-full bg-[#171717]/6 blur-[110px]" />
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden dark:block">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0d0d0d_0%,#111417_100%)]" />
        <div className="absolute -right-28 -top-20 h-[42rem] w-[42rem] rounded-full bg-[#28809A]/18 blur-[130px]" />
        <div className="absolute left-[-10rem] top-[28rem] h-[26rem] w-[26rem] rounded-full bg-white/5 blur-[110px]" />
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-20 dark:opacity-40" style={noiseStyle} />

      <div className="relative z-10">
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#f7f3ea]/75 px-6 py-5 backdrop-blur-xl md:px-10 lg:px-16 dark:border-white/10 dark:bg-[#0d0d0d]/70">
          <div className={cn(pageShell, 'flex items-center justify-between gap-4')}>
            <a href="#top" className="inline-flex items-center">
              <BrandLogo />
            </a>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="inline-flex size-11 items-center justify-center rounded-full border border-black/10 bg-white/70 text-[#171717] transition hover:border-[#28809A]/40 hover:text-[#28809A] dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:border-[#67d1e3]/40 dark:hover:text-[#67d1e3]"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>

              <a
                href="#cta"
                className="inline-flex items-center gap-2 rounded-[4px] bg-[#28809A] px-4 py-2.5 text-[0.85rem] font-medium tracking-[0.02em] text-white transition hover:bg-[#1c5f73]"
              >
                Request a Demo
              </a>
            </div>
          </div>
        </nav>

        <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-24 pt-32 md:px-10 lg:px-16 lg:pb-28">
          <div aria-hidden="true" className="absolute inset-0 dark:hidden" style={lightGridStyle} />
          <div aria-hidden="true" className="absolute inset-0 hidden dark:block" style={darkGridStyle} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(40,128,154,0.18)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(40,128,154,0.26)_0%,transparent_70%)]"
          />

          <div className={pageShell}>
            <div className="relative z-10 max-w-[780px]">
              <div className="mb-8 inline-flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#28809A] dark:text-[#67d1e3]">
                <span className="h-px w-6 bg-current" />
                For Property Owners in Kenya
              </div>

              <h1 className={cn(displayFontClass, 'mb-7 text-[clamp(2.8rem,6vw,5rem)] font-black leading-[1.08] tracking-[-0.03em] text-[#111111] dark:text-white')}>
                Your units should never
                <br />
                sit <span className="text-[#28809A] dark:text-[#67d1e3]">empty</span> between tenants.
              </h1>

              <p className="mb-5 text-[0.92rem] italic font-normal tracking-[0.01em] text-[#28809A] dark:text-[#67d1e3]">
                We believe the best person to find your next tenant is the one who just lived there.
              </p>

              <p className="mb-12 max-w-[520px] text-[1.1rem] leading-8 text-[#4e5457] dark:text-white/60">
                PataSpace connects your outgoing tenants directly with verified renters in your area -
                before the unit even goes cold.
              </p>

              <div className="mb-12 flex flex-wrap gap-x-12 gap-y-6">
                {[
                  ['50+', 'Properties already listed'],
                  ['0', 'Cost to property owners'],
                  ['15 min', 'Demo, no commitment'],
                ].map(([value, label]) => (
                  <div key={label} className="min-w-[8rem]">
                    <div className={cn(displayFontClass, 'text-[2.2rem] font-bold leading-none text-[#111111] dark:text-white')}>
                      {value}
                    </div>
                    <div className="mt-1 text-[0.78rem] tracking-[0.05em] text-[#6b7174] dark:text-[#8d9192]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <a
                  href="#cta"
                  className="inline-flex items-center gap-2 rounded-[4px] bg-[#28809A] px-8 py-3.5 text-[0.9rem] font-medium tracking-[0.02em] text-white transition hover:-translate-y-0.5 hover:bg-[#1c5f73]"
                >
                  Request a 15-Minute Demo
                  <ArrowRight className="size-4" />
                </a>

                <a
                  href="#how"
                  className="border-b border-[#111111]/20 pb-0.5 text-[0.85rem] text-[#171717]/60 transition hover:border-[#111111] hover:text-[#171717] dark:border-white/20 dark:text-white/50 dark:hover:border-white dark:hover:text-white"
                >
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        <section className={sectionShell}>
          <SectionLabel>The Real Cost of Vacancy</SectionLabel>

          <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <h2 className={sectionTitleClass}>Every day a unit sits empty, you are paying for it.</h2>
              <p className={cn(bodyTextClass, 'max-w-[600px]')}>
                The moment a tenant gives notice, a clock starts. You call an agent. The agent posts to
                WhatsApp groups and Facebook. Strangers visit at inconvenient hours. Weeks pass. The unit
                earns nothing - but the mortgage, water, and security bills do not pause.
              </p>

              <ul className="mt-10 space-y-5">
                {painPoints.map(({ title, body, Icon }) => (
                  <li
                    key={title}
                    className={cn(
                      cardClass,
                      'flex items-start gap-4 rounded-[6px] p-5 transition hover:border-[#28809A]/30 hover:bg-[#28809A]/5 dark:hover:bg-[#28809A]/8',
                    )}
                  >
                    <div className="mt-0.5 text-[#171717]/60 dark:text-white/70">
                      <Icon className="size-[1.1rem]" />
                    </div>
                    <div className="text-[0.92rem] leading-[1.65] text-[#51575a] dark:text-white/65">
                      <strong className="mb-1 block text-[0.95rem] font-medium text-[#111111] dark:text-white">
                        {title}
                      </strong>
                      {body}
                    </div>
                  </li>
                ))}
              </ul>

              <Reveal className="mt-10">
                <div className="space-y-3">
                  <div className="md:hidden text-[0.72rem] uppercase tracking-[0.12em] text-[#6b7174] dark:text-[#8d9192]">
                    Swipe to compare
                  </div>

                  <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className={cn(cardClass, 'min-w-[640px] overflow-hidden rounded-[8px]')}>
                      <div className="border-b border-black/10 bg-black/[0.02] px-5 py-4 text-[0.7rem] uppercase tracking-[0.15em] text-[#6b7174] dark:border-white/10 dark:bg-white/[0.01] dark:text-[#8d9192]">
                        The old way vs. the PataSpace way
                      </div>

                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border-r border-black/10 px-4 py-3 text-left dark:border-white/10" />
                            <th className="border-r border-black/10 px-4 py-3 text-left text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[#6b7174] dark:border-white/10 dark:text-[#8d9192]">
                              Traditional Agent
                            </th>
                            <th className="px-4 py-3 text-left text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[#28809A] dark:text-[#67d1e3]">
                              PataSpace
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {comparisonRows.map((row) => (
                            <tr key={row.label} className="border-t border-black/10 dark:border-white/10">
                              <th
                                scope="row"
                                className="border-r border-black/10 px-4 py-3 text-left text-[0.8rem] font-normal text-[#6b7174] dark:border-white/10 dark:text-white/40"
                              >
                                {row.label}
                              </th>
                              <td
                                className={cn(
                                  'border-r border-black/10 px-4 py-3 text-[0.82rem] leading-6 text-[#4f5457] dark:border-white/10 dark:text-white/60',
                                  row.traditionalClassName,
                                )}
                              >
                                {row.traditional}
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-3 text-[0.82rem] leading-6 text-[#4f5457] dark:text-white/60',
                                  row.pataspaceClassName,
                                )}
                              >
                                {row.pataspace}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Reveal>
            </Reveal>

            <Reveal className="lg:pt-1">
              <div className={cn(cardClass, 'rounded-[8px] p-8 lg:sticky lg:top-28')}>
                <div className="mb-6 text-[0.72rem] uppercase tracking-[0.15em] text-[#6b7174] dark:text-[#8d9192]">
                  Vacancy Cost Estimator
                </div>
                <div className={cn(displayFontClass, 'mb-1 text-[4rem] leading-none font-black text-[#d04f4f] dark:text-[#ef7a7a]')}>
                  21
                </div>
                <div className="mb-8 text-[0.85rem] text-[#6b7174] dark:text-[#8d9192]">
                  average days vacant per tenant turnover
                </div>

                {[
                  ['Monthly rent (example)', 'KES 25,000', 'text-[#111111] dark:text-white'],
                  ['Lost rent (21 days)', '- KES 17,500', 'text-[#d04f4f] dark:text-[#ef7a7a]'],
                  ['Agent commission', '- KES 2,500', 'text-[#d04f4f] dark:text-[#ef7a7a]'],
                  ['Total loss per vacancy', '- KES 20,000', 'text-[#d04f4f] dark:text-[#ef7a7a]'],
                  ['With PataSpace', 'KES 0', 'text-[#28809A] dark:text-[#67d1e3]'],
                ].map(([label, value, colorClass]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-black/10 py-3.5 text-[0.88rem] last:border-b-0 dark:border-white/10"
                  >
                    <span className="text-[#6b7174] dark:text-[#8d9192]">{label}</span>
                    <span className={cn('font-medium', colorClass)}>{value}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <Divider />

        <section id="how" className={sectionShell}>
          <SectionLabel>A Smarter Transition</SectionLabel>

          <Reveal className="max-w-[680px]">
            <h2 className={sectionTitleClass}>What if the tenant leaving was your best recruiter?</h2>
            <p className={bodyTextClass}>
              Your outgoing tenant knows the unit better than any agent. They know the neighborhood, the
              caretaker, the water schedule, the commute. PataSpace turns that knowledge into a direct
              connection with your next tenant - with no middleman and no vacancy window.
            </p>
          </Reveal>

          <Reveal className="mt-16 overflow-hidden rounded-[8px] border border-black/10 bg-black/8 dark:border-white/10 dark:bg-white/10">
            <div className="grid gap-px md:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="bg-white/75 p-8 transition hover:bg-[#28809A]/6 dark:bg-[#0d0d0d] dark:hover:bg-[#28809A]/8"
                >
                  <div className={cn(displayFontClass, 'mb-4 text-[3.5rem] leading-none font-black text-[#28809A]/20 dark:text-[#67d1e3]/20')}>
                    {step.number}
                  </div>
                  <div className="mb-3 text-[0.95rem] font-medium text-[#111111] dark:text-white">{step.title}</div>
                  <div className="text-[0.85rem] leading-7 text-[#6b7174] dark:text-[#8d9192]">{step.body}</div>
                  <div className="mt-5 inline-flex rounded-[3px] bg-[#28809A]/10 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.12em] text-[#28809A] dark:bg-[#67d1e3]/10 dark:text-[#67d1e3]">
                    {step.tag}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <Divider />

        <section className={sectionShell}>
          <SectionLabel>The Network Effect</SectionLabel>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <h2 className={sectionTitleClass}>The more landlords who join, the faster every unit fills.</h2>
              <p className={cn(bodyTextClass, 'max-w-[620px]')}>
                PataSpace is not a listing board. It is a two-sided network. Every property owner who
                consents brings their tenants onto the platform. Every tenant who joins brings renters.
                Every renter who buys credits creates M-Pesa commission for the next outgoing tenant. The
                network grows, and every unit becomes easier to fill than the last.
              </p>

              <div className="mt-8 rounded-[6px] border border-[#28809A]/25 bg-[#28809A]/10 px-6 py-5 text-[0.85rem] leading-7 text-[#355b64] italic dark:text-white/70">
                When you join today, you are not just solving your own vacancy problem. You are joining a
                network that gets more valuable for every landlord, every month.
              </div>
            </Reveal>

            <Reveal>
              <div className="overflow-hidden rounded-[8px] border border-black/10 bg-black/8 dark:border-white/10 dark:bg-white/10">
                {flywheelItems.map((item) => (
                  <div
                    key={item.title}
                    className={cn(
                      'flex gap-5 border-b border-black/10 px-7 py-6 transition last:border-b-0 dark:border-white/10',
                      item.highlight
                        ? 'bg-[#28809A]/8 dark:bg-[#28809A]/10'
                        : 'bg-white/75 hover:bg-[#28809A]/6 dark:bg-[#0d0d0d] dark:hover:bg-[#28809A]/8',
                    )}
                  >
                    <div
                      className={cn(
                        displayFontClass,
                        'shrink-0 pt-0.5 text-[1.4rem] text-[#28809A]/60 dark:text-[#67d1e3]/70',
                        item.highlight && 'text-[#28809A] dark:text-[#67d1e3]',
                      )}
                    >
                      {item.highlight ? <RotateCcw className="size-5" /> : item.arrow}
                    </div>
                    <div>
                      <strong
                        className={cn(
                          'mb-1 block text-[0.9rem] font-medium',
                          item.highlight
                            ? 'text-[#28809A] dark:text-[#67d1e3]'
                            : 'text-[#111111] dark:text-white',
                        )}
                      >
                        {item.title}
                      </strong>
                      <span className="text-[0.8rem] leading-6 text-[#6b7174] dark:text-[#8d9192]">
                        {item.body}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <Divider />

        <section className={sectionShell}>
          <SectionLabel>What You Gain</SectionLabel>

          <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <Reveal>
              <h2 className={sectionTitleClass}>Less vacancy. No agents. No cost to you.</h2>

              <ul className="mt-10 space-y-6">
                {benefits.map((benefit) => (
                  <li key={benefit.title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#28809A] bg-[#28809A]/10 text-[#28809A] dark:border-[#67d1e3] dark:bg-[#67d1e3]/10 dark:text-[#67d1e3]">
                      <Check className="size-3" />
                    </div>
                    <div className="text-[0.92rem] leading-[1.65] text-[#51575a] dark:text-white/65">
                      <strong className="mb-1 block text-[0.95rem] font-medium text-[#111111] dark:text-white">
                        {benefit.title}
                      </strong>
                      {benefit.body}
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal>
              <div className="rounded-[8px] border border-[#28809A]/30 bg-[#28809A]/10 p-10 text-center dark:border-[#67d1e3]/25 dark:bg-[#67d1e3]/10">
                <div className="mb-4 text-[0.72rem] uppercase tracking-[0.18em] text-[#6b7174] dark:text-[#8d9192]">
                  Your cost as a property owner
                </div>
                <div className={cn(displayFontClass, 'mb-2 text-[4rem] leading-none font-black text-[#28809A] dark:text-[#67d1e3]')}>
                  Free.
                </div>
                <div className="mb-6 text-[0.85rem] leading-7 text-[#5d6568] dark:text-[#8d9192]">
                  PataSpace is funded by renters who pay credits to unlock unit details. You are our
                  supply. We protect that relationship - which means you never pay us anything.
                </div>
                <a
                  href="#cta"
                  className="inline-flex items-center gap-2 rounded-[4px] bg-[#28809A] px-6 py-3 text-[0.9rem] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#1c5f73]"
                >
                  Request a Demo
                  <ArrowRight className="size-4" />
                </a>
                <div className="mt-4 text-[0.75rem] italic text-[#666d70] dark:text-white/25">
                  No subscription. No agent commission. No listing fee. Ever.
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <Divider />

        <section className={cn(sectionShell, 'pt-16 lg:pt-24')}>
          <SectionLabel>Early Traction</SectionLabel>

          <Reveal>
            <h2 className={sectionTitleClass}>Property owners across Nairobi are already on board.</h2>
          </Reveal>

          <Reveal className="mt-16 overflow-hidden rounded-[8px] border border-black/10 bg-black/8 dark:border-white/10 dark:bg-white/10">
            <div className="grid gap-px md:grid-cols-3">
              {proofStats.map((stat) => (
                <div key={stat.description} className="bg-white/75 px-8 py-10 text-center dark:bg-[#0d0d0d]">
                  <div className={cn(displayFontClass, 'mb-2 text-[3rem] leading-none font-black text-[#111111] dark:text-white')}>
                    {stat.value}
                  </div>
                  <div className="text-[0.82rem] leading-6 text-[#6b7174] dark:text-[#8d9192]">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-16 rounded-r-[6px] border-l-[3px] border-[#28809A] bg-white/60 px-8 py-10 dark:bg-white/[0.02]">
            <div className={cn(displayFontClass, 'mb-4 text-[1.2rem] leading-8 font-semibold italic text-[#202020] dark:text-white/85')}>
              &quot;The moment my tenant gave notice, I used to start worrying about the next three
              weeks. That anxiety was a hidden cost I had accepted as normal.&quot;
            </div>
            <div className="text-[0.8rem] tracking-[0.05em] text-[#6b7174] dark:text-[#8d9192]">
              - Property owner, Nairobi (Westlands portfolio, 4 units)
            </div>
          </Reveal>
        </section>

        <Divider />

        <section id="cta" className={cn(sectionShell, 'text-center')}>
          <SectionLabel centered>Founding Property Owners</SectionLabel>

          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-[20px] border border-[#28809A]/30 bg-[#28809A]/10 px-4 py-2 text-[0.75rem] uppercase tracking-[0.1em] text-[#28809A] dark:border-[#67d1e3]/30 dark:bg-[#67d1e3]/10 dark:text-[#67d1e3]">
              <span className="size-1.5 rounded-full bg-current animate-pulse" />
              Cohort currently open across Nairobi
            </div>
          </Reveal>

          <Reveal>
            <h2 className={cn(sectionTitleClass, 'mx-auto max-w-[760px] text-center')}>
              We are onboarding our first 100 property owners.
              <br />
              After that, renters come first.
            </h2>
          </Reveal>

          <Reveal>
            <p className="mx-auto mb-4 max-w-[540px] text-[0.95rem] leading-8 text-[#5b6367] dark:text-white/55">
              PataSpace is in its founding cohort phase. We are working directly with property owners in
              Westlands, Kilimani, Kasarani, and Eastlands to build listing density before we open the
              platform fully to renters. Landlords who join now get direct onboarding support and
              priority placement in the network.
            </p>
          </Reveal>

          <Reveal className="mb-10 flex flex-wrap justify-center gap-2">
            {areaTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-black/10 px-3 py-1.5 text-[0.75rem] text-[#6b7174] dark:border-white/10 dark:text-[#8d9192]"
              >
                {tag}
              </span>
            ))}
          </Reveal>

          <Reveal>
            <p className={cn(bodyTextClass, 'mx-auto mb-6 max-w-[500px] text-center')}>
              Every tenant turnover you do without PataSpace is a vacancy window you cannot recover. The
              next one does not have to work that way.
            </p>
          </Reveal>

          <Reveal className="mb-10 flex flex-wrap justify-center gap-x-10 gap-y-3">
            {riskReducers.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[0.82rem] text-[#6b7174] dark:text-[#8d9192]">
                <span className="size-1.5 rounded-full bg-[#28809A] dark:bg-[#67d1e3]" />
                {item}
              </div>
            ))}
          </Reveal>

          <Reveal>
            <form
              className="flex flex-wrap justify-center gap-4"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="owner-name" className="sr-only">
                Your name
              </label>
              <input
                id="owner-name"
                type="text"
                placeholder="Your name"
                className="w-full rounded-[4px] border border-black/12 bg-white/70 px-5 py-3.5 text-[0.9rem] text-[#111111] outline-none transition placeholder:text-[#6b7174]/60 focus:border-[#28809A] md:w-[260px] dark:border-white/12 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/30"
              />

              <label htmlFor="owner-phone" className="sr-only">
                Phone number (WhatsApp)
              </label>
              <input
                id="owner-phone"
                type="tel"
                placeholder="Phone number (WhatsApp)"
                className="w-full rounded-[4px] border border-black/12 bg-white/70 px-5 py-3.5 text-[0.9rem] text-[#111111] outline-none transition placeholder:text-[#6b7174]/60 focus:border-[#28809A] md:w-[260px] dark:border-white/12 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/30"
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#28809A] px-8 py-3.5 text-[0.9rem] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#1c5f73]"
              >
                Book My Demo
                <ArrowRight className="size-4" />
              </button>
            </form>
          </Reveal>

          <div className="mt-5 text-[0.78rem] text-[#6b7174]/70 dark:text-white/25">
            We will reach out within 24 hours to confirm a time that works for you.
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-black/10 px-6 py-10 text-center md:flex-row md:items-center md:justify-between md:px-10 lg:px-16 dark:border-white/10">
          <div className="inline-flex items-center justify-center md:justify-start">
            <BrandLogo compact />
          </div>
          <div className="text-[0.78rem] text-[#171717]/35 dark:text-white/20">
            &copy; 2026 PataSpace. Built for Kenya.
          </div>
        </footer>
      </div>
    </div>
  );
}
