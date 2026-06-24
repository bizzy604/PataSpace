'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock, Home, MapPin, Moon, Shield, Sun, Users } from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

type FormState = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate';

const valueProps = [
  {
    Icon: Home,
    title: 'No more empty units',
    body: 'Your outgoing tenant finds your next renter before they leave.',
  },
  {
    Icon: Shield,
    title: 'Zero cost to landlords',
    body: 'Renters pay credits to unlock listings. You never pay a cent.',
  },
  {
    Icon: Users,
    title: 'Verified renters only',
    body: 'Every renter who contacts you has already committed credits.',
  },
  {
    Icon: MapPin,
    title: 'Nairobi-first',
    body: 'Built for Kenya. Westlands, Kilimani, Kasarani, and beyond.',
  },
];

const heroHouseImages = [
  '/mock/houses/photo1.jpg',
  '/mock/houses/photo2.jpg',
  '/mock/houses/photo3.jpg',
  '/mock/houses/photo4.jpg',
  '/mock/houses/photo5.jpg',
  '/mock/houses/photo6.jpg',
];

function HeroMarqueeRow({ images, className }: { images: string[]; className?: string }) {
  const trackImages = [...images, ...images];
  return (
    <div className="landing-hero-marquee-stage">
      <div className={cn('landing-hero-marquee-track', className)}>
        {trackImages.map((src, index) => (
          <div key={`${src}-${index}`} className="landing-hero-marquee-card">
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 768px) 42vw, (max-width: 1280px) 20vw, 16vw"
              className="object-cover saturate-[0.9] contrast-[1.02]"
              quality={60}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.02)_40%,rgba(0,0,0,0.22)_100%)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WaitlistPage() {
  const [isDark, setIsDark] = useState(false);
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [position, setPosition] = useState<number | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

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
    media.addEventListener('change', syncTheme);
    const classObserver = new MutationObserver(syncTheme);
    classObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      nodes.forEach((node) => node.classList.add('is-visible'));
    } else {
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
    }

    return () => {
      media.removeEventListener('change', syncTheme);
      classObserver.disconnect();
    };
  }, [themeOverride]);

  useEffect(() => {
    if (themeOverride) {
      window.localStorage.setItem('pataspace-landing-theme', themeOverride);
    } else {
      window.localStorage.removeItem('pataspace-landing-theme');
    }
  }, [themeOverride]);

  useEffect(() => {
    fetch(`${API_BASE}/waitlist/count`)
      .then((res) => res.json())
      .then((data) => setWaitlistCount(data.count))
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setThemeOverride((current) => {
      if (current === 'dark') return 'light';
      if (current === 'light') return 'dark';
      return isDark ? 'light' : 'dark';
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setFormState('submitting');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          source: 'waitlist_page',
        }),
      });

      if (res.status === 409) {
        setFormState('duplicate');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Something went wrong');
      }

      const data = await res.json();
      setPosition(data.position);
      setWaitlistCount((prev) => (prev !== null ? prev + 1 : data.position));
      setFormState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setFormState('error');
    }
  };

  return (
    <div
      className={cn(
        isDark && 'dark',
        'relative isolate min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300',
      )}
    >
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-xl md:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
          <BrandLogo priority />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <a
              href="#join"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[0.85rem] font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-24 pt-32 md:px-10 lg:px-16 lg:pb-28">
        {/* Background marquee */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 -right-24 left-[-4%] flex flex-col justify-center gap-4 opacity-60 md:left-[6%] md:gap-6 lg:left-[12%]">
            <HeroMarqueeRow images={heroHouseImages} />
            <HeroMarqueeRow
              images={[...heroHouseImages].reverse()}
              className="landing-hero-marquee-track-slow"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.76)_24%,rgba(255,255,255,0.92)_50%,rgba(255,255,255,0.76)_76%,rgba(255,255,255,0.92)_100%)] dark:bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_24%,rgba(0,0,0,0.92)_50%,rgba(0,0,0,0.72)_76%,rgba(0,0,0,0.92)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(255,255,255,0.12)_24%,rgba(255,255,255,0.18)_74%,rgba(255,255,255,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.14)_24%,rgba(0,0,0,0.22)_72%,rgba(0,0,0,0.72)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[880px] flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[0.75rem] uppercase tracking-[0.1em] text-primary">
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            Launching Soon
          </div>

          <h1 className="mb-7 text-[clamp(2.4rem,5.5vw,4.5rem)] font-black leading-[1.08] tracking-[-0.03em] text-foreground">
            The end of{' '}
            <span className="text-primary">empty units</span>
            <br />
            between tenants.
          </h1>

          <p className="mb-5 text-[0.92rem] italic font-normal tracking-[0.01em] text-primary">
            Your outgoing tenant is the best person to find your next renter.
          </p>

          <p className="mb-10 max-w-[600px] text-[1.05rem] leading-8 text-muted-foreground">
            PataSpace connects outgoing tenants directly with verified renters in your area. No agents. No
            commissions. No vacancy window. Be the first to know when we launch.
          </p>

          {waitlistCount !== null && waitlistCount > 0 && (
            <div className="mb-8 flex items-center gap-3 rounded-full border border-border bg-card/80 px-5 py-2.5 text-[0.82rem] text-muted-foreground shadow-sm backdrop-blur-sm">
              <Users className="size-4 text-primary" />
              <span>
                <strong className="text-foreground">{waitlistCount.toLocaleString()}</strong> people already
                on the waitlist
              </span>
            </div>
          )}

          {/* Signup form */}
          <div id="join" className="w-full max-w-[520px]">
            {formState === 'success' ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center shadow-lg">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/15">
                  <Check className="size-7 text-primary" />
                </div>
                <h2 className="mb-2 text-[1.3rem] font-bold text-foreground">You're in.</h2>
                <p className="mb-1 text-[0.9rem] text-muted-foreground">
                  You're <strong className="text-primary">#{position}</strong> on the waitlist.
                </p>
                <p className="text-[0.82rem] text-muted-foreground">
                  We'll email you as soon as PataSpace opens.
                </p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-5 py-3.5 text-[0.9rem] text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-[180px]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full flex-1 rounded-xl border border-border bg-card px-5 py-3.5 text-[0.9rem] text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-[0.9rem] font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-60"
                >
                  {formState === 'submitting' ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join the Waitlist
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>

                {formState === 'duplicate' && (
                  <p className="text-center text-[0.82rem] text-primary">
                    You're already on the waitlist. We'll reach out soon.
                  </p>
                )}
                {formState === 'error' && (
                  <p className="text-center text-[0.82rem] text-destructive">{errorMessage}</p>
                )}

                <p className="text-center text-[0.72rem] text-muted-foreground">
                  No spam. Unsubscribe anytime. We only email you about launch updates.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="mx-6 border-0 border-t border-border/60 md:mx-10 lg:mx-16" />

      {/* Value props */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 lg:px-16 lg:py-28">
        <div className="mb-5 inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-0.5 w-6 rounded-full bg-primary/40" />
          Why PataSpace
        </div>
        <div data-reveal className="landing-reveal">
          <h2 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.12] tracking-[-0.025em] text-foreground">
            A smarter way to fill your units.
          </h2>
          <p className="mb-14 max-w-[600px] text-[1.05rem] leading-8 text-muted-foreground">
            We're building the platform Nairobi landlords have needed for years. Here's what's coming.
          </p>
        </div>
        <div data-reveal className="landing-reveal grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map(({ Icon, title, body }) => (
            <article
              key={title}
              className="rounded-xl border border-border bg-card p-7 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mb-2 text-[0.95rem] font-semibold text-foreground">{title}</h3>
              <p className="text-[0.82rem] leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Divider */}
      <hr className="mx-6 border-0 border-t border-border/60 md:mx-10 lg:mx-16" />

      {/* How it works teaser */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 lg:px-16 lg:py-28">
        <div className="mb-5 inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-0.5 w-6 rounded-full bg-primary/40" />
          How It Works
        </div>
        <div data-reveal className="landing-reveal grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-6 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.12] tracking-[-0.025em] text-foreground">
              Three steps. Zero hassle.
            </h2>
            <div className="space-y-6">
              {[
                {
                  number: '01',
                  title: 'Landlord consents once',
                  body: 'You authorize PataSpace for your property. That is all you ever do.',
                },
                {
                  number: '02',
                  title: 'Tenant lists the unit',
                  body: 'Your outgoing tenant posts photos, location, and details. Verified renters see it instantly.',
                },
                {
                  number: '03',
                  title: 'Verified renter contacts you',
                  body: 'No agent. No WhatsApp chains. A renter who chose your unit reaches your caretaker directly.',
                },
              ].map((step) => (
                <div key={step.number} className="flex gap-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[1.1rem] font-black text-primary">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="mb-1 text-[0.95rem] font-semibold text-foreground">{step.title}</h3>
                    <p className="text-[0.82rem] leading-6 text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-primary/10 p-10 text-center shadow-lg">
            <Clock className="mx-auto mb-4 size-10 text-primary/60" />
            <div className="mb-2 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
              Average vacancy period in Nairobi
            </div>
            <div className="mb-1 text-[3.5rem] font-black leading-none text-destructive">21</div>
            <div className="mb-6 text-[0.85rem] text-muted-foreground">days of lost rent per turnover</div>
            <div className="mb-2 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
              With PataSpace
            </div>
            <div className="mb-4 text-[3.5rem] font-black leading-none text-primary">0</div>
            <div className="text-[0.85rem] text-muted-foreground">
              cost to property owners. No commissions. No listing fees. Ever.
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="mx-6 border-0 border-t border-border/60 md:mx-10 lg:mx-16" />

      {/* Bottom CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 text-center md:px-10 lg:px-16 lg:py-28">
        <div data-reveal className="landing-reveal">
          <h2 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.12] tracking-[-0.025em] text-foreground">
            Don't miss the launch.
          </h2>
          <p className="mx-auto mb-8 max-w-[500px] text-[1.05rem] leading-8 text-muted-foreground">
            We're onboarding a founding cohort of property owners across Nairobi. Get early access.
          </p>
          <a
            href="#join"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-[0.9rem] font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            Join the Waitlist
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-4 border-t border-border/60 px-6 py-10 text-center md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
        <div className="inline-flex items-center justify-center md:justify-start">
          <BrandLogo compact />
        </div>
        <div className="text-[0.78rem] text-muted-foreground">
          &copy; 2026 PataSpace. Built for Kenya.
        </div>
      </footer>
    </div>
  );
}
