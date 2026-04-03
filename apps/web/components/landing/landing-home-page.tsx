'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bath,
  BedDouble,
  Filter,
  Instagram,
  Linkedin,
  LogIn,
  MessageCircle,
  Phone,
  Plus,
  Quote,
  Ruler,
  Search,
  ShieldCheck,
  Star,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

type CategoryCard = {
  title: string;
  count: string;
  image: string;
};

type PropertyCard = {
  id: string;
  title: string;
  address: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  size: string;
  image: string;
  type: string;
};

type TeamMember = {
  name: string;
  role: string;
  initials: string;
};

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  initials: string;
};

const categoryCards: CategoryCard[] = [
  { title: 'Bedsitter', count: '126 listings', image: '/mock/houses/photo6.jpg' },
  { title: '1 Bedroom', count: '214 listings', image: '/mock/houses/photo2.jpg' },
  { title: '2 Bedroom', count: '312 listings', image: '/mock/houses/photo1.jpg' },
  { title: '3 Bedroom', count: '118 listings', image: '/mock/houses/photo3.jpg' },
  { title: 'Townhouse', count: '42 listings', image: '/mock/houses/photo4.jpg' },
];

const homesForYou: PropertyCard[] = [
  {
    id: 'home-1',
    title: 'Modern 2BR near Waiyaki Way',
    address: 'Westlands, Nairobi',
    area: 'Westlands',
    price: 45000,
    beds: 2,
    baths: 1,
    size: '850 sqft',
    image: '/mock/houses/photo1.jpg',
    type: '2 Bedroom',
  },
  {
    id: 'home-2',
    title: 'Sunny 1BR in Kilimani',
    address: 'Argwings Kodhek Road',
    area: 'Kilimani',
    price: 28000,
    beds: 1,
    baths: 1,
    size: '540 sqft',
    image: '/mock/houses/photo5.jpg',
    type: '1 Bedroom',
  },
  {
    id: 'home-3',
    title: 'Calm 3BR family home',
    address: 'Lavington, Nairobi',
    area: 'Lavington',
    price: 68000,
    beds: 3,
    baths: 2,
    size: '1,240 sqft',
    image: '/mock/houses/photo3.jpg',
    type: '3 Bedroom',
  },
];

const featuredProperties: PropertyCard[] = [
  {
    id: 'featured-1',
    title: 'Balcony 2BR with parking',
    address: 'Westlands, Nairobi',
    area: 'Westlands',
    price: 52000,
    beds: 2,
    baths: 2,
    size: '920 sqft',
    image: '/mock/houses/photo1.jpg',
    type: '2 Bedroom',
  },
  {
    id: 'featured-2',
    title: 'Quiet 1BR close to Yaya',
    address: 'Kilimani, Nairobi',
    area: 'Kilimani',
    price: 31000,
    beds: 1,
    baths: 1,
    size: '580 sqft',
    image: '/mock/houses/photo5.jpg',
    type: '1 Bedroom',
  },
  {
    id: 'featured-3',
    title: 'Garden-facing family unit',
    address: 'Lavington, Nairobi',
    area: 'Lavington',
    price: 76000,
    beds: 3,
    baths: 2,
    size: '1,380 sqft',
    image: '/mock/houses/photo3.jpg',
    type: '3 Bedroom',
  },
  {
    id: 'featured-4',
    title: 'Commuter-friendly studio',
    address: 'South B, Nairobi',
    area: 'South B',
    price: 18000,
    beds: 1,
    baths: 1,
    size: '410 sqft',
    image: '/mock/houses/photo6.jpg',
    type: 'Bedsitter',
  },
  {
    id: 'featured-5',
    title: 'Sunlit 2BR with city access',
    address: 'Parklands, Nairobi',
    area: 'Parklands',
    price: 49000,
    beds: 2,
    baths: 2,
    size: '890 sqft',
    image: '/mock/houses/photo2.jpg',
    type: '2 Bedroom',
  },
];

const featuredTabs = ['All', 'Westlands', 'Kilimani', 'Lavington', 'South B', 'Parklands'] as const;

const trustPartners = ['M-Pesa', 'Safaricom', "Africa's Talking", 'DigitalOcean', 'AWS'];

const testimonials: Testimonial[] = [
  {
    name: 'Christine W.',
    role: 'Outgoing Tenant',
    quote:
      'I posted my apartment during a relocation week and got serious interest almost immediately. The handover felt cleaner because people called with real context, not broker scripts.',
    initials: 'CW',
  },
  {
    name: 'James M.',
    role: 'Incoming Tenant',
    quote:
      'Talking to the actual tenant saved me from wasting two more weekends on bad viewings. I got the truth about the landlord and the water schedule before I moved.',
    initials: 'JM',
  },
  {
    name: 'Pamela N.',
    role: 'Outgoing Tenant',
    quote:
      'The commission arrived through M-Pesa after confirmation, and that made moving out feel far less chaotic than the usual deposit-and-agent drama.',
    initials: 'PN',
  },
];

const teamMembers: TeamMember[] = [
  { name: 'Amina Kariuki', role: 'Product and Growth', initials: 'AK' },
  { name: 'Brian Otieno', role: 'Engineering and Platform', initials: 'BO' },
  { name: 'Mercy Wanjiku', role: 'Operations and Trust', initials: 'MW' },
  { name: 'David Njoroge', role: 'Marketplace Partnerships', initials: 'DN' },
];

const creditPackages = [
  {
    name: 'Starter',
    credits: '3 credits',
    price: 'KES 300',
    note: 'Good for light browsing and first-time unlocks.',
  },
  {
    name: 'Popular',
    credits: '10 credits',
    price: 'KES 800',
    note: 'Best for active house hunting with multiple serious leads.',
    featured: true,
  },
  {
    name: 'Bulk',
    credits: '25 credits',
    price: 'KES 1,750',
    note: 'Built for repeat searchers and relocation support.',
  },
];

const howItWorksSteps = [
  {
    title: 'Post from mobile with GPS-backed media',
    body: 'Outgoing tenants capture the home through the mobile flow so the listing starts with stronger evidence.',
    Icon: Plus,
  },
  {
    title: 'Browse free and unlock only when ready',
    body: 'Incoming tenants view the listing context first, then pay only when they decide the home is worth pursuing.',
    Icon: Search,
  },
  {
    title: 'Confirm the handover and trigger payout',
    body: 'Once the move is confirmed, the platform can safely progress the outgoing-tenant commission workflow.',
    Icon: ShieldCheck,
  },
];

function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <div
      data-reveal
      className={cn('landing-reveal', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  center?: boolean;
}) {
  return (
    <Reveal className={cn(center && 'mx-auto max-w-[640px] text-center')}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#28809A]">{eyebrow}</p>
      <h2 className="mt-4 font-display text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.05] tracking-[-0.06em] text-[#252525]">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-[#8D9192]">{description}</p>
    </Reveal>
  );
}

function ListingCard({
  listing,
  overlayPrice = false,
}: {
  listing: PropertyCard;
  overlayPrice?: boolean;
}) {
  const formattedPrice = `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(listing.price)}`;

  return (
    <div className="group overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_rgba(37,37,37,0.08)] transition duration-300 hover:-translate-y-1">
      <div className="relative h-56 overflow-hidden">
        <Image src={listing.image} alt={listing.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 360px, 100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,37,37,0.02),rgba(37,37,37,0.35))]" />
        <span className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">Available</span>
        {overlayPrice ? (
          <span className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1 text-sm font-semibold text-[#28809A]">
            {formattedPrice} / mo
          </span>
        ) : null}
        <Link
          href="/listings"
          className="absolute inset-x-4 bottom-4 inline-flex items-center justify-center rounded-full bg-[#252525] px-4 py-3 text-sm font-medium text-white transition duration-300 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          Unlock Contact
        </Link>
      </div>
      <div className="p-5">
        {!overlayPrice ? (
          <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#28809A]">{formattedPrice} / mo</p>
        ) : null}
        <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">{listing.title}</h3>
        <p className="mt-2 text-sm text-[#8D9192]">{listing.address}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#8D9192]">
          <span className="inline-flex items-center gap-2">
            <BedDouble className="size-4" />
            {listing.beds} beds
          </span>
          <span className="inline-flex items-center gap-2">
            <Bath className="size-4" />
            {listing.baths} bath
          </span>
          <span className="inline-flex items-center gap-2">
            <Ruler className="size-4" />
            {listing.size}
          </span>
        </div>
        {!overlayPrice ? (
          <Link
            href="/listings"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#252525] transition group-hover:text-[#28809A]"
          >
            View details
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function HeroSection({
  navScrolled,
  searchMode,
  setSearchMode,
  location,
  setLocation,
  bedrooms,
  setBedrooms,
  priceRange,
  setPriceRange,
  searchHref,
}: {
  navScrolled: boolean;
  searchMode: 'find' | 'rent' | 'post';
  setSearchMode: (value: 'find' | 'rent' | 'post') => void;
  location: string;
  setLocation: (value: string) => void;
  bedrooms: string;
  setBedrooms: (value: string) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  searchHref: string;
}) {
  const navTextClass = navScrolled ? 'text-[#252525]' : 'text-white';

  return (
    <>
      <nav
        className={cn(
          'fixed inset-x-0 top-0 z-50 h-[60px] transition-all',
          navScrolled ? 'border-b border-black/8 bg-white/82 backdrop-blur-xl' : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#" className={cn('flex items-center gap-2 font-display text-[1.05rem] font-semibold tracking-[-0.04em]', navTextClass)}>
            <span className="size-2 rounded-full bg-[#28809A]" />
            PataSpace
          </a>

          <div className="hidden items-center gap-6 lg:flex">
            <a href="#" className={cn('text-sm transition hover:text-[#28809A]', navTextClass)}>
              Home
            </a>
            <Link href="/listings" className={cn('text-sm transition hover:text-[#28809A]', navTextClass)}>
              Browse
            </Link>
            <a href="#how-it-works" className={cn('text-sm transition hover:text-[#28809A]', navTextClass)}>
              How it Works
            </a>
            <Link href="/about" className={cn('text-sm transition hover:text-[#28809A]', navTextClass)}>
              Blog
            </Link>
            <Link href="/support" className={cn('text-sm transition hover:text-[#28809A]', navTextClass)}>
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a href="tel:+254700123123" className={cn('hidden items-center gap-2 text-sm md:inline-flex', navTextClass)}>
              <Phone className="size-4 text-[#28809A]" />
              +254 700 123 123
            </a>
            <Link
              href="/auth/sign-in"
              className="inline-flex size-10 items-center justify-center rounded-full border border-black/8 bg-white/92 text-[#252525] shadow-[0_8px_20px_rgba(37,37,37,0.08)]"
              aria-label="Sign in"
            >
              <LogIn className="size-4" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#28809A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#21687d]"
            >
              <Plus className="size-4" />
              Add Listing
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/mock/houses/photo1.jpg"
          alt="Modern Nairobi apartment exterior"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,37,37,0.24),rgba(37,37,37,0.62))]" />

        <div className="relative mx-auto flex min-h-screen max-w-[980px] items-center justify-center px-5 pb-52 pt-32 text-center sm:px-8">
          <Reveal className="max-w-[820px]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/78">Built in Nairobi, for Nairobi</p>
            <h1 className="mt-5 font-display text-[clamp(2.8rem,6vw,5.6rem)] font-bold leading-[0.95] tracking-[-0.08em] text-white">
              Find Your Next
              <br />
              Home in Nairobi
            </h1>
            <p className="mx-auto mt-6 max-w-[620px] text-[1.05rem] leading-8 text-white/78">
              Connect directly with tenants leaving their homes. No agents. No hidden broker fees.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="relative z-20 -mt-32 px-5 sm:px-8">
        <Reveal className="mx-auto max-w-[1180px] rounded-[28px] bg-white p-4 shadow-[0_28px_80px_rgba(37,37,37,0.16)] sm:p-6">
          <div className="flex flex-wrap gap-2 border-b border-black/8 pb-4">
            {[
              { key: 'find', label: 'Find' },
              { key: 'rent', label: 'Rent' },
              { key: 'post', label: 'Post' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSearchMode(tab.key as 'find' | 'rent' | 'post')}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  searchMode === tab.key ? 'bg-[#252525] text-white' : 'bg-[#EDEDED] text-[#8D9192] hover:text-[#252525]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
            <label className="rounded-[18px] border border-black/8 bg-[#fafafa] px-4 py-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Location</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm text-[#252525] outline-none"
              >
                <option>Westlands</option>
                <option>Kilimani</option>
                <option>Lavington</option>
                <option>South B</option>
                <option>Parklands</option>
              </select>
            </label>

            <label className="rounded-[18px] border border-black/8 bg-[#fafafa] px-4 py-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Bedrooms</span>
              <select
                value={bedrooms}
                onChange={(event) => setBedrooms(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm text-[#252525] outline-none"
              >
                <option>Bedsitter</option>
                <option>1 Bedroom</option>
                <option>2 Bedroom</option>
                <option>3 Bedroom</option>
                <option>Townhouse</option>
              </select>
            </label>

            <label className="rounded-[18px] border border-black/8 bg-[#fafafa] px-4 py-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Price range</span>
              <select
                value={priceRange}
                onChange={(event) => setPriceRange(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm text-[#252525] outline-none"
              >
                <option>KES 10k - 20k</option>
                <option>KES 20k - 50k</option>
                <option>KES 50k - 80k</option>
                <option>KES 80k+</option>
              </select>
            </label>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-[18px] border border-black/8 bg-[#fafafa] px-5 py-4 text-sm font-medium text-[#252525] transition hover:border-[#28809A]/35 hover:text-[#28809A]"
            >
              <Filter className="mr-2 size-4" />
              Filter
            </button>

            <Link
              href={searchHref}
              className="inline-flex items-center justify-center rounded-[18px] bg-[#28809A] px-6 py-4 text-sm font-medium text-white transition hover:bg-[#21687d]"
            >
              {searchMode === 'post' ? (
                <>
                  <Plus className="mr-2 size-4" />
                  Start Posting
                </>
              ) : (
                <>
                  <Search className="mr-2 size-4" />
                  Search
                </>
              )}
            </Link>
          </div>
        </Reveal>

        <Reveal className="mx-auto mt-6 max-w-[920px] rounded-[24px] bg-white px-5 py-5 shadow-[0_20px_48px_rgba(37,37,37,0.12)] sm:px-8" delay={120}>
          <div className="grid gap-6 text-center sm:grid-cols-3">
            {[
              { value: '2,000+', label: 'Active Listings' },
              { value: '500+', label: 'Successful Move-ins' },
              { value: 'Zero', label: 'Agent Fees' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-4xl font-bold tracking-[-0.06em] text-[#252525]">{stat.value}</p>
                <p className="mt-1 text-sm text-[#8D9192]">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </>
  );
}

function CategoriesSection() {
  return (
    <section className="content-auto px-5 pb-24 pt-40 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          eyebrow="Browse by Type"
          title="Based on your housing needs"
          description="Start with the kind of home you need before you narrow down the exact neighborhood."
          center
        />

        <div className="mt-12 flex gap-5 overflow-x-auto pb-2">
          {categoryCards.map((category, index) => (
            <Reveal
              key={category.title}
              className="min-w-[240px] flex-1 rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_14px_34px_rgba(37,37,37,0.06)] transition hover:-translate-y-1 hover:border-[#28809A]/35"
              delay={80 + index * 70}
            >
              <div className="relative h-40 overflow-hidden rounded-[18px]">
                <Image src={category.image} alt={category.title} fill className="object-cover" sizes="240px" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">{category.title}</h3>
              <p className="mt-2 text-sm text-[#8D9192]">{category.count}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomesForYouSection() {
  return (
    <section className="content-auto bg-[#EDEDED] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          eyebrow="Listings For You"
          title="Based on your search area"
          description="A first pass at the homes most likely to matter, with the paid step reserved for direct contact."
          center
        />

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {homesForYou.map((listing, index) => (
            <Reveal key={listing.id} delay={100 + index * 80}>
              <ListingCard listing={listing} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn('size-2 rounded-full', index === 0 ? 'bg-[#28809A]' : 'bg-black/12')}
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-medium text-[#252525] transition hover:text-[#28809A]">
            View all listings
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="content-auto scroll-mt-24 bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          eyebrow="How it Works"
          title="A simpler marketplace loop for both sides of the move"
          description="The structure is intentionally clear: post with evidence, browse for free, unlock direct contact, then confirm the outcome."
          center
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {howItWorksSteps.map(({ title, body, Icon }, index) => (
            <Reveal
              key={title}
              className="rounded-[28px] border border-black/8 bg-[#fafafa] p-7 shadow-[0_12px_28px_rgba(37,37,37,0.05)]"
              delay={100 + index * 70}
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#28809A]/12 text-[#28809A]">
                <Icon className="size-5" />
              </div>
              <p className="mt-6 font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">{title}</p>
              <p className="mt-3 text-sm leading-7 text-[#8D9192]">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SplitFeatureSection() {
  return (
    <section className="content-auto bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <Reveal className="relative">
          <div className="relative h-[460px] overflow-hidden rounded-[32px]">
            <Image src="/mock/houses/photo2.jpg" alt="Outgoing tenant in a bright apartment setting" fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
          <div className="absolute bottom-6 left-6 rounded-[20px] bg-[#28809A] px-6 py-5 text-white shadow-[0_22px_48px_rgba(40,128,154,0.32)]">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/72">Marketplace signal</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">KES 2.5M</p>
            <p className="mt-1 text-sm text-white/78">commissions paid out</p>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            eyebrow="For Outgoing Tenants"
            title="Move out. List once. Earn your commission."
            description="The mobile-first posting flow lets outgoing tenants publish with GPS-backed media, meet serious incoming renters, and earn through M-Pesa after a confirmed handover."
          />

          <Reveal className="mt-8" delay={120}>
            <Link
              href="/auth/register"
              className="inline-flex items-center rounded-full bg-[#252525] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#28809A]"
            >
              Learn More
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function TrustStripSection() {
  return (
    <section className="content-auto bg-[#252525] px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="text-center">
          <p className="text-sm text-white/72">Thousands of Nairobians trust PataSpace</p>
        </Reveal>
        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-4" delay={120}>
          {trustPartners.map((partner) => (
            <div
              key={partner}
              className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white/82"
            >
              {partner}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function FeaturedPropertiesSection({
  featuredFilter,
  setFeaturedFilter,
  featuredListings,
}: {
  featuredFilter: (typeof featuredTabs)[number];
  setFeaturedFilter: (value: (typeof featuredTabs)[number]) => void;
  featuredListings: PropertyCard[];
}) {
  return (
    <section className="content-auto bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          eyebrow="Featured Properties"
          title="Homes with enough context to move faster"
          description="Use the neighborhood filters to narrow the shortlist, then unlock direct contact only when a listing actually feels worth it."
          center
        />

        <Reveal className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {featuredTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFeaturedFilter(tab)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition',
                featuredFilter === tab ? 'bg-[#252525] text-white' : 'bg-[#EDEDED] text-[#8D9192] hover:text-[#252525]',
              )}
            >
              {tab}
            </button>
          ))}
        </Reveal>

        <div className="mt-12 grid gap-6 xl:grid-cols-4">
          {featuredListings.map((listing, index) => (
            <Reveal key={listing.id} delay={100 + index * 70}>
              <ListingCard listing={listing} overlayPrice />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="content-auto bg-[#EDEDED] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeading
            eyebrow="What our users are saying"
            title="Built around real Nairobi moves"
            description="A better marketplace is not the slogan. It is how the move actually feels once people start using it."
          />
          <Reveal className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#252525] shadow-[0_8px_24px_rgba(37,37,37,0.08)]">
            <Star className="size-4 fill-[#28809A] text-[#28809A]" />
            4.8 - 200+ reviews
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal
              key={item.name}
              className="rounded-[28px] bg-white p-7 shadow-[0_14px_34px_rgba(37,37,37,0.06)]"
              delay={100 + index * 80}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#28809A]/12 font-display text-sm font-semibold text-[#28809A]">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold tracking-[-0.04em] text-[#252525]">{item.name}</p>
                    <p className="text-sm text-[#8D9192]">{item.role}</p>
                  </div>
                </div>
                <Quote className="size-8 text-[#28809A]" />
              </div>
              <div className="mt-5 flex gap-1 text-[#28809A]">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="size-4 fill-current" />
                ))}
              </div>
              <p className="mt-5 text-base leading-8 text-[#8D9192]">{item.quote}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="content-auto bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          eyebrow="Built in Nairobi, for Nairobi"
          title="A local team shaping the tenant-to-tenant flow"
          description="The product, trust, and operations layers are being built around the actual friction points of moving homes in Nairobi."
          center
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member, index) => (
            <Reveal
              key={member.name}
              className="rounded-[28px] border border-black/8 bg-[#fafafa] p-6 text-center"
              delay={100 + index * 70}
            >
              <div className="mx-auto flex size-24 items-center justify-center rounded-[28px] bg-[#252525] font-display text-2xl font-semibold tracking-[-0.05em] text-white">
                {member.initials}
              </div>
              <p className="mt-5 font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">{member.name}</p>
              <p className="mt-2 text-sm text-[#8D9192]">{member.role}</p>
              <a
                href="#"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#28809A]"
                aria-label={`${member.name} LinkedIn`}
              >
                <Linkedin className="size-4" />
                LinkedIn
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreditPackagesSection() {
  return (
    <section className="content-auto bg-[#EDEDED] px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
        <Reveal className="relative h-[420px] overflow-hidden rounded-[32px]">
          <Image src="/mock/houses/photo4.jpg" alt="User browsing properties on a phone" fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
        </Reveal>

        <div>
          <SectionHeading
            eyebrow="Discover Our Credit Packages"
            title="Fund your wallet through M-Pesa and unlock serious leads"
            description="The wallet funding UI follows the wireframe package structure, while the actual unlock charge still depends on the rent of the listing you choose."
          />

          <div className="mt-10 grid gap-4">
            {creditPackages.map((pkg, index) => (
              <Reveal
                key={pkg.name}
                className={cn(
                  'rounded-[24px] border p-6 shadow-[0_12px_28px_rgba(37,37,37,0.06)]',
                  pkg.featured ? 'border-[#28809A]/30 bg-[#28809A] text-white' : 'border-black/8 bg-white',
                )}
                delay={100 + index * 80}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className={cn('font-display text-xl font-semibold tracking-[-0.04em]', pkg.featured ? 'text-white' : 'text-[#252525]')}>
                      {pkg.name}
                    </p>
                    <p className={cn('mt-1 text-sm', pkg.featured ? 'text-white/76' : 'text-[#8D9192]')}>{pkg.credits}</p>
                  </div>
                  <p className={cn('font-display text-2xl font-semibold tracking-[-0.04em]', pkg.featured ? 'text-white' : 'text-[#252525]')}>
                    {pkg.price}
                  </p>
                </div>
                <p className={cn('mt-4 text-sm leading-7', pkg.featured ? 'text-white/84' : 'text-[#8D9192]')}>{pkg.note}</p>
                <Link
                  href="/wallet/buy"
                  className={cn(
                    'mt-5 inline-flex items-center rounded-full px-5 py-3 text-sm font-medium transition',
                    pkg.featured ? 'bg-white text-[#28809A] hover:bg-white/90' : 'bg-[#252525] text-white hover:bg-[#28809A]',
                  )}
                >
                  Buy via M-Pesa
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-[#1a1a1a] px-5 pb-8 pt-16 text-white sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 border-b border-white/8 pb-10 md:grid-cols-2 xl:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-display text-[1.05rem] font-semibold tracking-[-0.04em] text-white">
              <span className="size-2 rounded-full bg-[#28809A]" />
              PataSpace
            </div>
            <p className="mt-4 max-w-[280px] text-sm leading-7 text-white/46">
              Nairobi&apos;s tenant-to-tenant housing marketplace for finding homes with better context and fewer middlemen.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/68">
              <ShieldCheck className="size-4 text-[#28809A]" />
              M-Pesa badge
            </div>
            <div className="mt-5 flex items-center gap-3">
              {[Twitter, Instagram, Linkedin, MessageCircle].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/70 transition hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/34">Browse</p>
            <div className="mt-4 flex flex-col gap-3">
              {['Bedsitter', '1 Bedroom', '2 Bedroom', '3 Bedroom', 'Townhouse'].map((item) => (
                <Link key={item} href="/listings" className="text-sm text-white/58 transition hover:text-white/82">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/34">Company</p>
            <div className="mt-4 flex flex-col gap-3">
              {['About', 'Blog', 'Careers', 'Press'].map((item) => (
                <Link key={item} href="/about" className="text-sm text-white/58 transition hover:text-white/82">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/34">Support</p>
            <div className="mt-4 flex flex-col gap-3">
              {['Help', 'Contact', 'Safety', 'Disputes'].map((item) => (
                <Link key={item} href="/support" className="text-sm text-white/58 transition hover:text-white/82">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-sm text-white/36">
          <p>&copy; 2026 PataSpace. Built in Nairobi, for Nairobi.</p>
          <div className="flex items-center gap-5">
            <Link href="/about" className="transition hover:text-white/60">
              Privacy
            </Link>
            <Link href="/about" className="transition hover:text-white/60">
              Terms
            </Link>
            <Link href="/about" className="transition hover:text-white/60">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingHomePage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [searchMode, setSearchMode] = useState<'find' | 'rent' | 'post'>('find');
  const [location, setLocation] = useState('Westlands');
  const [bedrooms, setBedrooms] = useState('2 Bedroom');
  const [priceRange, setPriceRange] = useState('KES 20k - 50k');
  const [featuredFilter, setFeaturedFilter] = useState<(typeof featuredTabs)[number]>('All');

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (reducedMotion) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
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
      { threshold: 0.08, rootMargin: '0px 0px -10% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const featuredListings = useMemo(() => {
    if (featuredFilter === 'All') {
      return featuredProperties.slice(0, 4);
    }

    return featuredProperties.filter((listing) => listing.area === featuredFilter);
  }, [featuredFilter]);

  const searchHref =
    searchMode === 'post'
      ? '/auth/register'
      : `/listings?location=${encodeURIComponent(location)}&bedrooms=${encodeURIComponent(bedrooms)}&price=${encodeURIComponent(priceRange)}`;

  return (
    <div className="bg-white text-[#252525]">
      <HeroSection
        navScrolled={navScrolled}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        location={location}
        setLocation={setLocation}
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        searchHref={searchHref}
      />
      <CategoriesSection />
      <HomesForYouSection />
      <HowItWorksSection />
      <SplitFeatureSection />
      <TrustStripSection />
      <FeaturedPropertiesSection
        featuredFilter={featuredFilter}
        setFeaturedFilter={setFeaturedFilter}
        featuredListings={featuredListings}
      />
      <TestimonialsSection />
      <TeamSection />
      <CreditPackagesSection />
      <LandingFooter />
    </div>
  );
}
