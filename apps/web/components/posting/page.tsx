import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ImagePlus, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { linkButtonClass } from '@/lib/link-button';
import { getListingVisual } from '@/lib/listing-visuals';
import { mockListings } from '@/lib/mock-listings';

export function PostUploadPhotosPage() {
  const listing = mockListings[0];
  const visual = getListingVisual(listing.id);

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Post listing"
        title="Review photos before you continue"
        description="This native web version borrows from the Stitch photo-review screen: cover media, GPS-backed status, and a clear step into the details form."
        actions={
          <>
            <Link href="/post/details" className={linkButtonClass({ size: 'sm' })}>
              Continue to details
            </Link>
            <Link href="/listings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              Back to browse
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                {listing.media.length} of 5 minimum photos
              </div>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Photo review grid
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Media order, cover image, and GPS-linked evidence should be clear before the property details form.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visual.gallery.map((image, index) => (
                <div key={image} className="overflow-hidden rounded-[24px] border border-black/8 bg-[#fbfaf7]">
                  <div className="relative h-52">
                    <Image
                      src={image}
                      alt={`${listing.title} media ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1280px) 220px, (min-width: 640px) 50vw, 100vw"
                    />
                    {index === 0 ? (
                      <span className="absolute left-3 top-3 rounded-full bg-[#252525] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        Cover
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="font-medium text-[#252525]">{listing.media[index]?.title ?? `Photo ${index + 1}`}</p>
                    <p className="text-sm text-[#62686a]">{listing.media[index]?.gpsTag ?? 'GPS review pending'}</p>
                  </div>
                </div>
              ))}

              <div className="flex min-h-[288px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/18 bg-[#f7f4ee] p-6 text-center">
                <ImagePlus className="size-8 text-[#28809A]" />
                <p className="mt-4 font-medium text-[#252525]">Add more photos</p>
                <p className="mt-2 text-sm leading-7 text-[#62686a]">
                  Expand the gallery up to the allowed cap and keep the clearest frame as cover.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  Property video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-[28px] border border-black/8 bg-[#252525] p-6 text-white">
                  <p className="inline-flex items-center gap-2 font-medium">
                    <PlayCircle className="size-5 text-[#8ed7e7]" />
                    Record an optional walkthrough
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/74">
                    Keep it under 30 seconds and capture the spaces most likely to influence unlock decisions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  Next step
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-[#62686a]">
                <p>The next route captures rent, location, amenities, and availability. That information drives the unlock cost automatically.</p>
                <Link href="/post/details" className={linkButtonClass({ size: 'sm' })}>
                  Continue to details
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

export function PostDetailsPage() {
  const listing = mockListings[0];

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Post listing"
        title="Enter the property details"
        description="The details form mirrors the Stitch structure: rent-driven unlock pricing, verified neighborhood, amenities, and move-out notes."
        actions={
          <>
            <Link href="/post/upload-photos" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              Back to photos
            </Link>
            <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
              Preview browse
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Property details form
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Fields are prefilled from the mock listing so the route behaves like a native draft form instead of a missing Stitch frame.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#252525]">
                  Monthly rent (KES)
                  <Input className="h-11 rounded-2xl" defaultValue={listing.monthlyRent} />
                </label>
                <label className="space-y-2 text-sm font-medium text-[#252525]">
                  County
                  <Input className="h-11 rounded-2xl bg-[#f7f4ee]" defaultValue={listing.county} readOnly />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#252525]">
                  Neighborhood
                  <Input className="h-11 rounded-2xl" defaultValue={listing.neighborhood} />
                </label>
                <label className="space-y-2 text-sm font-medium text-[#252525]">
                  Property type
                  <Input className="h-11 rounded-2xl" defaultValue={listing.propertyType} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#252525]">
                  Bedrooms
                  <Input className="h-11 rounded-2xl" defaultValue={listing.bedrooms} />
                </label>
                <label className="space-y-2 text-sm font-medium text-[#252525]">
                  Bathrooms
                  <Input className="h-11 rounded-2xl" defaultValue={listing.bathrooms} />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-[#252525]">
                Listing description
                <Textarea className="min-h-32 rounded-[24px]" defaultValue={listing.description} />
              </label>

              <label className="space-y-2 text-sm font-medium text-[#252525]">
                Additional notes
                <Textarea className="min-h-28 rounded-[24px]" defaultValue={listing.propertyNotes} />
              </label>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
                  Unlock rule preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-white/76">
                <p>Monthly rent directly sets the unlock fee at 10% of rent.</p>
                <p>Current draft unlock cost: {listing.unlockCostCredits.toLocaleString('en-KE')} KES.</p>
                <p>That keeps listing economics aligned with the marketplace rules already documented for PataSpace.</p>
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  Amenities
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {listing.amenities.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/8 bg-[#fbfaf7] px-3 py-2 text-sm text-[#4b4f50]"
                  >
                    {item}
                  </span>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}
