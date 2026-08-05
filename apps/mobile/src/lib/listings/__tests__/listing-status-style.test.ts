/**
 * Purpose: Gate-test the status pill colour rule and the taken predicate, and
 *   assert listing-card.tsx actually renders the mapped classes instead of a
 *   hardcoded fill.
 * Why important: The bug was a green "Taken" badge — the pill said available
 *   while the API answered 410 on unlock. A screenshot looks fine, so only a
 *   test catches the regression. The mobile jest lane transforms `.ts` only and
 *   has no renderer, so the card check reads the tsx as source, the same way
 *   listing-card-tap-target.test.ts does.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { stripComments } from '../../jsx-nesting';
import { isListingTaken, listingStatusPillClasses } from '../listing-status-style';
import type { ListingStatus } from '@/data/mock-listings';

const ALL_STATUSES: ListingStatus[] = [
  'Verified',
  'Hot',
  'New',
  'Live',
  'Review',
  'Taken',
  'Closed',
];

describe('listingStatusPillClasses', () => {
  it('keeps green for the available statuses', () => {
    for (const status of ['Verified', 'New', 'Live'] as ListingStatus[]) {
      expect(listingStatusPillClasses(status).container).toContain('bg-success');
    }
  });

  // The whole point of the fix: green reads as "you can have this".
  it('does not paint a taken house green', () => {
    expect(listingStatusPillClasses('Taken').container).not.toContain('success');
  });

  it('gives Taken its own neutral fill', () => {
    expect(listingStatusPillClasses('Taken').container).toBe('bg-surface-inverse');
  });

  it('separates Review from both available and taken', () => {
    const review = listingStatusPillClasses('Review').container;
    expect(review).not.toContain('success');
    expect(review).not.toBe(listingStatusPillClasses('Taken').container);
  });

  it('covers every status in the union', () => {
    for (const status of ALL_STATUSES) {
      expect(listingStatusPillClasses(status).container).toBeTruthy();
      expect(listingStatusPillClasses(status).text).toBeTruthy();
    }
  });

  // css-interop 0.2.6 crashes when a dynamic class map varies which utility
  // families it sets, so each entry must set exactly one bg and one text.
  it('sets the same utility families for every status', () => {
    for (const status of ALL_STATUSES) {
      const { container, text } = listingStatusPillClasses(status);
      expect(container.split(' ').filter((c) => c.startsWith('bg-'))).toHaveLength(1);
      expect(text.split(' ').filter((c) => c.startsWith('text-'))).toHaveLength(1);
    }
  });

  it('falls back to Closed styling for an unknown status', () => {
    expect(listingStatusPillClasses('Nonsense' as ListingStatus)).toEqual(
      listingStatusPillClasses('Closed'),
    );
  });
});

describe('isListingTaken', () => {
  it('is true only for Taken', () => {
    expect(isListingTaken('Taken')).toBe(true);
    for (const status of ALL_STATUSES.filter((s) => s !== 'Taken')) {
      expect(isListingTaken(status)).toBe(false);
    }
  });
});

describe('listing card status pill', () => {
  const cardPath = path.resolve(__dirname, '../../../components/ui/listing-card.tsx');
  const source = stripComments(fs.readFileSync(cardPath, 'utf8'));

  it('drives the pill from the status map', () => {
    expect(source).toContain('listingStatusPillClasses');
  });

  it('no longer hardcodes a green pill', () => {
    expect(source).not.toContain('rounded-full bg-success px-3');
  });
});
