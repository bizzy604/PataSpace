'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ClipboardList, Clock3, Moon, Repeat2, RotateCcw, Sun } from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';

const sectionShell = 'mx-auto max-w-[1400px] px-6 py-20 md:px-10 lg:px-16 lg:py-28';
const sectionTitleClass = 'text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-foreground';
const bodyTextClass = 'text-[1.05rem] leading-8 text-muted-foreground';
const cardClass = 'border border-border bg-card';

type PainPoint = { title: string; body: string; Icon: typeof Clock3 };
type ComparisonRow = { label: string; traditional: string; pataspace: string; traditionalClassName?: string; pataspaceClassName?: string };
type Step = { number: string; title: string; body: string; tag: string };
type FlywheelItem = { arrow: string; title: string; body: string; highlight?: boolean };
type Benefit = { title: string; body: string };
type ProofStat = { value: ReactNode; description: string };

const painPoints: PainPoint[] = [
  { title: 'Average vacancy period in Nairobi: 3-6 weeks', body: 'That is lost rent you will never recover, happening silently, every cycle.', Icon: Clock3 },
  { title: "Agents who don't know your property like your tenants do", body: 'They post generic descriptions. Your unit becomes one of fifty listings. Serious renters move on.', Icon: ClipboardList },
  { title: 'This cycle repeats every time a tenant leaves', body: 'It is not a one-time problem. It is a structural gap in how property transitions work in Kenya.', Icon: Repeat2 },
];

const comparisonRows: ComparisonRow[] = [
  { label: 'Who advertises your unit', traditional: 'A stranger who has never been inside', pataspace: 'The tenant who lived there', pataspaceClassName: 'text-primary font-medium' },
  { label: 'Who sees the listing', traditional: 'Everyone, qualified or not', pataspace: 'Renters actively looking, right now', pataspaceClassName: 'text-primary font-medium' },
  { label: 'Renter intent', traditional: 'Unknown until they call', pataspace: 'Verified - they paid credits to unlock your unit', pataspaceClassName: 'text-primary font-medium' },
  { label: 'Your cost', traditional: 'Commission per let', pataspace: 'Zero. Forever.', traditionalClassName: 'text-destructive', pataspaceClassName: 'text-primary font-medium' },
  { label: 'Time to first serious inquiry', traditional: '1-3 weeks', pataspace: 'Days', traditionalClassName: 'text-destructive', pataspaceClassName: 'text-primary font-medium' },
];

const steps: Step[] = [
  { number: '01', title: 'You give a one-time consent', body: 'You authorize PataSpace for your property. That is all you ever do. One decision, one time.', tag: 'Property Owner' },
  { number: '02', title: 'Your tenant lists the unit when they leave', body: 'They post photos, a description, and the location. Verified renters on PataSpace see it immediately and unlock the contact details using credits.', tag: 'Outgoing Tenant' },
  { number: '03', title: 'A verified renter contacts you directly', body: 'No agent in the middle. No WhatsApp chains. A renter who has already seen the unit and chosen it reaches your caretaker directly.', tag: 'Incoming Tenant' },
];

const flywheelItems: FlywheelItem[] = [
  { arrow: '->', title: 'Landlord consents once', body: 'Their property enters the network permanently. No action needed again.' },
  { arrow: '->', title: 'Outgoing tenant lists the unit', body: 'Real photos, real details, real GPS. From someone who lived there.' },
  { arrow: '->', title: 'Verified renter unlocks the details', body: 'They pay credits to access the landlord contact and exact location.' },
  { arrow: '->', title: 'Outgoing tenant earns M-Pesa commission', body: 'The cycle rewards everyone - and makes the next listing even more trusted.' },
  { arrow: '->>', title: '50+ properties already in the network', body: 'Every new landlord increases listing density in their area for all renters searching nearby.', highlight: true },
];

const benefits: Benefit[] = [
  { title: 'Faster tenant transitions', body: 'Renters on PataSpace are already looking. Your unit reaches them before it even goes cold.' },
  { title: 'No agent commissions. No listing fees.', body: 'You pay nothing. The platform is funded by renters who unlock unit details - not by you.' },
  { title: 'Better-informed renters arrive at your door', body: "They've seen the GPS location, the photos, the real details. No wasted viewings. No time-wasters." },
  { title: 'Your tenants become a community asset', body: 'When you onboard your tenants to PataSpace, you give them a tool that earns them M-Pesa commission when they leave. That is a benefit you offer them.' },
];

const proofStats: ProofStat[] = [
  { value: (<>50<span className="text-primary">+</span></>), description: 'Properties already listed on the platform by early partners' },
  { value: (<><span className="text-primary">^</span>3x</>), description: 'Faster to find a tenant compared to traditional agent listings' },
  { value: (<>KES <span className="text-primary">0</span></>), description: 'Total cost paid by any property owner on the platform' },
];

const riskReducers = ['No subscription required', 'No agent fees, ever', 'Cancel consent anytime', '15 minutes, no pressure'];
const areaTags = ['Westlands', 'Kilimani', 'Kasarani', 'Eastlands', '+ surrounding areas'];
const heroHouseImages = ['/mock/houses/photo1.jpg', '/mock/houses/photo2.jpg', '/mock/houses/photo3.jpg', '/mock/houses/photo4.jpg', '/mock/houses/photo5.jpg', '/mock/houses/photo6.jpg'];

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div data-owner-reveal className={cn('landing-reveal', className)}>{children}</div>;
}

function SectionLabel({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className={cn('mb-5 inline-flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-primary', centered && 'justify-center')}>
      <span className="h-px w-6 bg-current" />
      {children}
    </div>
  );
}

function Divider() {
  return <hr className="mx-6 border-0 border-t border-border md:mx-10 lg:mx-16" />;
}

function HeroMarqueeRow({ images, className }: { images: string[]; className?: string }) {
  const trackImages = [...images, ...images];
  return (
    <div className="landing-hero-marquee-stage">
      <div className={cn('landing-hero-marquee-track', className)}>
        {trackImages.map((src, index) => (
          <div key={`${src}-${index}`} className="landing-hero-marquee-card">
            <Image src={src} alt="" fill sizes="(max-width: 768px) 42vw, (max-width: 1280px) 20vw, 16vw" className="object-cover saturate-[0.9] contrast-[1.02]" quality={60} />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.02)_40%,rgba(0,0,0,0.22)_100%)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroBackgroundMarquee() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 -right-24 left-[-4%] flex flex-col justify-center gap-4 opacity-60 md:left-[6%] md:gap-6 lg:left-[12%]">
        <HeroMarqueeRow images={heroHouseImages} />
        <HeroMarqueeRow images={[...heroHouseImages].reverse()} className="landing-hero-marquee-track-slow" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.76)_24%,rgba(255,255,255,0.92)_50%,rgba(255,255,255,0.76)_76%,rgba(255,255,255,0.92)_100%)] dark:bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_24%,rgba(0,0,0,0.92)_50%,rgba(0,0,0,0.72)_76%,rgba(0,0,0,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(255,255,255,0.12)_24%,rgba(255,255,255,0.18)_74%,rgba(255,255,255,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.14)_24%,rgba(0,0,0,0.22)_72%,rgba(0,0,0,0.72)_100%)]" />
    </div>
  );
}

export function LandingHomePage() {
  const [isDark, setIsDark] = useState(false);
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('pataspace-landing-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setThemeOverride(savedTheme);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;
    const syncTheme = () => {
      if (themeOverride === 'dark') { setIsDark(true); return; }
      if (themeOverride === 'light') { setIsDark(false); return; }
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
      return () => { media.removeEventListener('change', mediaListener); classObserver.disconnect(); };
    }
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); },
      { threshold: 0.1 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => { observer.disconnect(); media.removeEventListener('change', mediaListener); classObserver.disconnect(); };
  }, [themeOverride]);

  useEffect(() => {
    if (themeOverride) { window.localStorage.setItem('pataspace-landing-theme', themeOverride); return; }
    window.localStorage.removeItem('pataspace-landing-theme');
  }, [themeOverride]);

  const toggleTheme = () => {
    setThemeOverride((current) => {
      if (current === 'dark') return 'light';
      if (current === 'light') return 'dark';
      return isDark ? 'light' : 'dark';
    });
  };

  return (
    <div id="top" className={cn(isDark && 'dark', 'relative isolate overflow-x-hidden bg-background text-foreground transition-colors duration-300')}>
      <div className="relative z-10">
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background px-6 py-5 md:px-10 lg:px-16">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
            <a href="#top" aria-label="PataSpace home" className="inline-flex items-center">
              <BrandLogo priority />
            </a>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="inline-flex size-11 items-center justify-center border border-border bg-card text-foreground transition hover:bg-muted"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <a href="#cta" className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-[0.85rem] font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                Request a Demo
              </a>
            </div>
          </div>
        </nav>

        <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-24 pt-32 md:px-10 lg:px-16 lg:pb-28">
          <HeroBackgroundMarquee />
          <div className="relative flex w-full max-w-[1400px] mx-auto justify-center">
            <div className="relative z-10 mx-auto flex max-w-[880px] flex-col items-center text-center">
              <div className="mb-8 inline-flex items-center justify-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-primary">
                <span className="h-px w-6 bg-current" />
                For Property Owners in Kenya
              </div>
              <h1 className="mb-7 max-w-[12ch] text-[clamp(2.8rem,6vw,5rem)] font-black leading-[1.08] tracking-[-0.03em] text-foreground">
                Your units should never
                <br />
                sit <span className="text-primary">empty</span> between tenants.
              </h1>
              <p className="mb-5 text-[0.92rem] italic font-normal tracking-[0.01em] text-primary">
                We believe the best person to find your next tenant is the one who just lived there.
              </p>
              <p className="mb-12 max-w-[620px] text-[1.1rem] leading-8 text-muted-foreground">
                PataSpace connects your outgoing tenants directly with verified renters in your area — before the unit even goes cold.
              </p>
              <div className="mb-12 flex flex-wrap justify-center gap-x-12 gap-y-6">
                {[['50+', 'Properties already listed'], ['0', 'Cost to property owners'], ['15 min', 'Demo, no commitment']].map(([value, label]) => (
                  <div key={label} className="min-w-[8rem] text-center">
                    <div className="text-[2.2rem] font-bold leading-none text-foreground">{value}</div>
                    <div className="mt-1 text-[0.78rem] tracking-[0.05em] text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                <a href="#cta" className="inline-flex items-center gap-2 bg-primary px-8 py-3.5 text-[0.9rem] font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  Request a 15-Minute Demo
                  <ArrowRight className="size-4" />
                </a>
                <a href="#how" className="border-b border-foreground/20 pb-0.5 text-[0.85rem] text-muted-foreground transition hover:border-foreground hover:text-foreground">
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        <section className={sectionShell}>
          <SectionLabel>The Real Cost of Vacancy</SectionLabel>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <h2 className={sectionTitleClass}>Every day a unit sits empty, you are paying for it.</h2>
              <p className={cn(bodyTextClass, 'max-w-[600px]')}>
                The moment a tenant gives notice, a clock starts. You call an agent. The agent posts to WhatsApp groups and Facebook. Strangers visit at inconvenient hours. Weeks pass. The unit earns nothing — but the mortgage, water, and security bills do not pause.
              </p>
              <ul className="mt-10 space-y-5">
                {painPoints.map(({ title, body, Icon }) => (
                  <li key={title} className={cn(cardClass, 'flex items-start gap-4 p-5 transition hover:border-primary')}>
                    <div className="mt-0.5 text-muted-foreground"><Icon className="size-[1.1rem]" /></div>
                    <div className="text-[0.92rem] leading-[1.65] text-muted-foreground">
                      <strong className="mb-1 block text-[0.95rem] font-medium text-foreground">{title}</strong>
                      {body}
                    </div>
                  </li>
                ))}
              </ul>

              <Reveal className="mt-10">
                <div className="space-y-3">
                  <div className="grid gap-3 md:hidden">
                    {comparisonRows.map((row) => (
                      <article key={row.label} className={cn(cardClass, 'p-4')}>
                        <div className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">{row.label}</div>
                        <div className="mt-4 grid gap-3">
                          <div className="border border-border bg-muted p-3">
                            <div className="text-[0.68rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Traditional Agent</div>
                            <div className={cn('mt-2 text-[0.82rem] leading-6 text-muted-foreground', row.traditionalClassName)}>{row.traditional}</div>
                          </div>
                          <div className="border border-primary/30 bg-primary/10 p-3">
                            <div className="text-[0.68rem] font-medium uppercase tracking-[0.1em] text-primary">PataSpace</div>
                            <div className={cn('mt-2 text-[0.82rem] leading-6 text-muted-foreground', row.pataspaceClassName)}>{row.pataspace}</div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <div className={cn(cardClass, 'overflow-hidden')}>
                      <div className="border-b border-border bg-muted px-5 py-4 text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
                        The old way vs. the PataSpace way
                      </div>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border-r border-border px-4 py-3 text-left" />
                            <th className="border-r border-border px-4 py-3 text-left text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Traditional Agent</th>
                            <th className="px-4 py-3 text-left text-[0.7rem] font-medium uppercase tracking-[0.1em] text-primary">PataSpace</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRows.map((row) => (
                            <tr key={row.label} className="border-t border-border">
                              <th scope="row" className="border-r border-border px-4 py-3 text-left text-[0.8rem] font-normal text-muted-foreground">{row.label}</th>
                              <td className={cn('border-r border-border px-4 py-3 text-[0.82rem] leading-6 text-muted-foreground', row.traditionalClassName)}>{row.traditional}</td>
                              <td className={cn('px-4 py-3 text-[0.82rem] leading-6 text-muted-foreground', row.pataspaceClassName)}>{row.pataspace}</td>
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
              <div className={cn(cardClass, 'p-6 shadow-sm sm:p-8 lg:sticky lg:top-28')}>
                <div className="mb-6 text-[0.72rem] uppercase tracking-[0.15em] text-muted-foreground">Vacancy Cost Estimator</div>
                <div className="mb-1 text-[3.2rem] leading-none font-black text-destructive sm:text-[4rem]">21</div>
                <div className="mb-8 text-[0.85rem] text-muted-foreground">average days vacant per tenant turnover</div>
                {[
                  ['Monthly rent (example)', 'KES 25,000', 'text-foreground'],
                  ['Lost rent (21 days)', '- KES 17,500', 'text-destructive'],
                  ['Agent commission', '- KES 2,500', 'text-destructive'],
                  ['Total loss per vacancy', '- KES 20,000', 'text-destructive'],
                  ['With PataSpace', 'KES 0', 'text-primary'],
                ].map(([label, value, colorClass]) => (
                  <div key={label} className="flex items-center justify-between border-b border-border py-3.5 text-[0.88rem] last:border-b-0">
                    <span className="text-muted-foreground">{label}</span>
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
              Your outgoing tenant knows the unit better than any agent. They know the neighborhood, the caretaker, the water schedule, the commute. PataSpace turns that knowledge into a direct connection with your next tenant — with no middleman and no vacancy window.
            </p>
          </Reveal>
          <Reveal className="mt-16 overflow-hidden border border-border bg-muted">
            <div className="grid gap-px md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.number} className="bg-card p-8 transition hover:bg-primary/5">
                  <div className="mb-4 text-[3.5rem] leading-none font-black text-primary/20">{step.number}</div>
                  <div className="mb-3 text-[0.95rem] font-medium text-foreground">{step.title}</div>
                  <div className="text-[0.85rem] leading-7 text-muted-foreground">{step.body}</div>
                  <div className="mt-5 inline-flex bg-primary/10 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.12em] text-primary">{step.tag}</div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <Divider />

        <section className={sectionShell}>
          <SectionLabel>The Network Effect</SectionLabel>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <h2 className={sectionTitleClass}>The more landlords who join, the faster every unit fills.</h2>
              <p className={cn(bodyTextClass, 'max-w-[620px]')}>
                PataSpace is not a listing board. It is a two-sided network. Every property owner who consents brings their tenants onto the platform. Every tenant who joins brings renters. Every renter who buys credits creates M-Pesa commission for the next outgoing tenant. The network grows, and every unit becomes easier to fill than the last.
              </p>
              <div className="mt-8 border border-primary/30 bg-primary/10 px-6 py-5 text-[0.85rem] leading-7 text-foreground italic">
                When you join today, you are not just solving your own vacancy problem. You are joining a network that gets more valuable for every landlord, every month.
              </div>
            </Reveal>
            <Reveal>
              <div className="overflow-hidden border border-border bg-muted">
                {flywheelItems.map((item) => (
                  <div
                    key={item.title}
                    className={cn('flex gap-5 border-b border-border px-7 py-6 transition last:border-b-0', item.highlight ? 'bg-primary/10' : 'bg-card hover:bg-primary/5')}
                  >
                    <div className={cn('shrink-0 pt-0.5 text-[1.4rem] text-primary/50', item.highlight && 'text-primary')}>
                      {item.highlight ? <RotateCcw className="size-5" /> : item.arrow}
                    </div>
                    <div>
                      <strong className={cn('mb-1 block text-[0.9rem] font-medium', item.highlight ? 'text-primary' : 'text-foreground')}>{item.title}</strong>
                      <span className="text-[0.8rem] leading-6 text-muted-foreground">{item.body}</span>
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
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <Reveal>
              <h2 className={sectionTitleClass}>Less vacancy. No agents. No cost to you.</h2>
              <ul className="mt-10 space-y-6">
                {benefits.map((benefit) => (
                  <li key={benefit.title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center border border-primary bg-primary/10 text-primary">
                      <Check className="size-3" />
                    </div>
                    <div className="text-[0.92rem] leading-[1.65] text-muted-foreground">
                      <strong className="mb-1 block text-[0.95rem] font-medium text-foreground">{benefit.title}</strong>
                      {benefit.body}
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal>
              <div className="border border-primary/30 bg-primary/10 p-10 text-center shadow-sm">
                <div className="mb-4 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">Your cost as a property owner</div>
                <div className="mb-2 text-[4rem] leading-none font-black text-primary">Free.</div>
                <div className="mb-6 text-[0.85rem] leading-7 text-muted-foreground">
                  PataSpace is funded by renters who pay credits to unlock unit details. You are our supply. We protect that relationship — which means you never pay us anything.
                </div>
                <a href="#cta" className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-[0.9rem] font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  Request a Demo
                  <ArrowRight className="size-4" />
                </a>
                <div className="mt-4 text-[0.75rem] italic text-muted-foreground">No subscription. No agent commission. No listing fee. Ever.</div>
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
          <Reveal className="mt-16 overflow-hidden border border-border bg-muted">
            <div className="grid gap-px md:grid-cols-3">
              {proofStats.map((stat) => (
                <div key={stat.description} className="bg-card px-8 py-10 text-center">
                  <div className="mb-2 text-[3rem] leading-none font-black text-foreground">{stat.value}</div>
                  <div className="text-[0.82rem] leading-6 text-muted-foreground">{stat.description}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="mt-16 border-l-[3px] border-primary bg-card px-8 py-10 shadow-sm">
            <div className="mb-4 text-[1.2rem] leading-8 font-semibold italic text-foreground">
              &quot;The moment my tenant gave notice, I used to start worrying about the next three weeks. That anxiety was a hidden cost I had accepted as normal.&quot;
            </div>
            <div className="text-[0.8rem] tracking-[0.05em] text-muted-foreground">
              — Property owner, Nairobi (Westlands portfolio, 4 units)
            </div>
          </Reveal>
        </section>

        <Divider />

        <section id="cta" className={cn(sectionShell, 'text-center')}>
          <SectionLabel centered>Founding Property Owners</SectionLabel>
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-4 py-2 text-[0.75rem] uppercase tracking-[0.1em] text-primary">
              <span className="size-1.5 bg-current animate-pulse" />
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
            <p className="mx-auto mb-4 max-w-[540px] text-[0.95rem] leading-8 text-muted-foreground">
              PataSpace is in its founding cohort phase. We are working directly with property owners in Westlands, Kilimani, Kasarani, and Eastlands to build listing density before we open the platform fully to renters. Landlords who join now get direct onboarding support and priority placement in the network.
            </p>
          </Reveal>
          <Reveal className="mb-10 flex flex-wrap justify-center gap-2">
            {areaTags.map((tag) => (
              <span key={tag} className="border border-border bg-muted px-3 py-1.5 text-[0.75rem] text-muted-foreground">{tag}</span>
            ))}
          </Reveal>
          <Reveal>
            <p className={cn(bodyTextClass, 'mx-auto mb-6 max-w-[500px] text-center')}>
              Every tenant turnover you do without PataSpace is a vacancy window you cannot recover. The next one does not have to work that way.
            </p>
          </Reveal>
          <Reveal className="mb-10 flex flex-wrap justify-center gap-x-10 gap-y-3">
            {riskReducers.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[0.82rem] text-muted-foreground">
                <span className="size-1.5 bg-primary" />
                {item}
              </div>
            ))}
          </Reveal>
          <Reveal>
            <form className="flex flex-wrap justify-center gap-4" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="owner-name" className="sr-only">Your name</label>
              <input
                id="owner-name"
                type="text"
                placeholder="Your name"
                className="w-full border border-border bg-card px-5 py-3.5 text-[0.9rem] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary md:w-[260px]"
              />
              <label htmlFor="owner-phone" className="sr-only">Phone number (WhatsApp)</label>
              <input
                id="owner-phone"
                type="tel"
                placeholder="Phone number (WhatsApp)"
                className="w-full border border-border bg-card px-5 py-3.5 text-[0.9rem] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary md:w-[260px]"
              />
              <button type="submit" className="inline-flex items-center justify-center gap-2 bg-primary px-8 py-3.5 text-[0.9rem] font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                Book My Demo
                <ArrowRight className="size-4" />
              </button>
            </form>
          </Reveal>
          <div className="mt-5 text-[0.78rem] text-muted-foreground">We will reach out within 24 hours to confirm a time that works for you.</div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-border px-6 py-10 text-center md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
          <div className="inline-flex items-center justify-center md:justify-start">
            <BrandLogo compact />
          </div>
          <div className="text-[0.78rem] text-muted-foreground">&copy; 2026 PataSpace. Built for Kenya.</div>
        </footer>
      </div>
    </div>
  );
}
