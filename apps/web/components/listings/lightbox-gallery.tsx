'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Share2, X } from 'lucide-react';

type LightboxGalleryProps = {
  title: string;
  images: string[];
  alt: string;
  backHref: string;
};

export function LightboxGallery({ title, images, alt, backHref }: LightboxGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = images[activeIndex] ?? images[0];

  function goTo(index: number) {
    const nextIndex = (index + images.length) % images.length;
    setActiveIndex(nextIndex);
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#252525] text-white">
      <div className="flex items-center justify-between px-4 py-5 sm:px-8">
        <div>
          <p className="text-sm text-white/64">{title}</p>
          <p className="mt-1 text-base font-semibold">
            {activeIndex + 1} of {images.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#28809A]"
            aria-label="Share image"
          >
            <Share2 className="size-4" />
          </button>
          <Link
            href={backHref}
            className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#28809A]"
            aria-label="Close viewer"
          >
            <X className="size-4" />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-[1320px] items-center justify-center px-4 pb-8 sm:px-8">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-4 top-1/2 z-10 inline-flex size-[60px] -translate-y-1/2 items-center justify-center rounded-full bg-[#28809A]/90 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 sm:left-8"
          aria-label="Previous image"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px]">
          <Image
            src={activeImage}
            alt={alt}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-4 top-1/2 z-10 inline-flex size-[60px] -translate-y-1/2 items-center justify-center rounded-full bg-[#28809A]/90 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 sm:right-8"
          aria-label="Next image"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="border-t border-white/10 bg-[#1e1e1e] px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border ${
                index === activeIndex ? 'border-[#28809A]' : 'border-white/20'
              }`}
              aria-label={`Open image ${index + 1}`}
            >
              <Image src={image} alt={`${alt} thumbnail ${index + 1}`} fill className="object-cover" sizes="72px" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
