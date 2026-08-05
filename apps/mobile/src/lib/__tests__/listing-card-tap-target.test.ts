/**
 * Purpose: Gate-test that the whole listing card — photo and body — is a tap
 *   target that navigates to the listing, not just the "View Details" row.
 * Why important: Amoni's report was that touching the photo or the price did
 *   nothing; only the small link at the bottom opened the listing. That is the
 *   kind of regression a refactor reintroduces silently, because the card still
 *   looks right in a screenshot. The mobile jest lane transforms `.ts` only and
 *   has no renderer, so the check reads listing-card.tsx as source, the same way
 *   css-interop-upgrade.test.ts does.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { isInsideElement, stripComments } from '../jsx-nesting';
import { listingCardAccessibilityLabel } from '../listings/listing-card-a11y';

const cardPath = path.resolve(__dirname, '../../components/ui/listing-card.tsx');
const source = fs.readFileSync(cardPath, 'utf8');

describe('listing card tap target', () => {
  it('wraps the photo in a Pressable', () => {
    expect(isInsideElement(source, 'Pressable', '<Image')).toBe(true);
  });

  it('wraps the price in the same Pressable', () => {
    expect(isInsideElement(source, 'Pressable', '{listing.price}')).toBe(true);
  });

  it('wraps the location in the same Pressable', () => {
    expect(isInsideElement(source, 'Pressable', '{listing.location}')).toBe(true);
  });

  it('wraps the blurb in the same Pressable', () => {
    expect(isInsideElement(source, 'Pressable', '{listing.blurb}')).toBe(true);
  });

  it('routes that Pressable through a Link, so it navigates to href', () => {
    expect(isInsideElement(source, 'Link', '<Image')).toBe(true);
  });

  // A caller-supplied footer can hold its own buttons. Nesting those inside the
  // card-wide Pressable would make the outer and inner targets fight over the
  // touch, so the footer must stay outside it.
  it('leaves the footer outside the card-wide Pressable', () => {
    expect(isInsideElement(source, 'Pressable', '{footer ??')).toBe(false);
  });

  it('keeps the visible action row as an affordance', () => {
    expect(stripComments(source)).toContain('{actionLabel}');
  });

  it('announces the card to a screen reader as a button', () => {
    expect(stripComments(source)).toContain('accessibilityRole="button"');
  });

  // The action row points at the same destination as the card, so a screen
  // reader reading both would say it twice.
  it('hides the duplicate action row from screen readers', () => {
    expect(stripComments(source)).toContain('importantForAccessibility="no-hide-descendants"');
  });
});

describe('listingCardAccessibilityLabel', () => {
  const listing = { price: 'KES 25,000', location: 'Kilimani, Nairobi', status: 'Live' };

  it('reads as one sentence covering price, location, status, and action', () => {
    expect(listingCardAccessibilityLabel(listing, 'View Details')).toBe(
      'KES 25,000 per month, Kilimani, Nairobi. Live. View Details',
    );
  });

  it('carries the status, so a taken house is not announced like an open one', () => {
    expect(listingCardAccessibilityLabel({ ...listing, status: 'Taken' }, 'View Details')).toContain(
      'Taken',
    );
  });

  it('uses the caller action label, which differs once a listing is unlocked', () => {
    expect(listingCardAccessibilityLabel(listing, 'Open Contact')).toContain('Open Contact');
  });
});

describe('isInsideElement', () => {
  it('sees an element nested inside an open tag', () => {
    expect(isInsideElement('<A><B>needle</B></A>', 'A', 'needle')).toBe(true);
  });

  it('sees an element after that tag closed', () => {
    expect(isInsideElement('<A><B /></A>needle', 'A', 'needle')).toBe(false);
  });

  it('does not count a self-closing tag as open', () => {
    expect(isInsideElement('<A className="x" />needle', 'A', 'needle')).toBe(false);
  });

  it('handles a sibling that opened and closed before the needle', () => {
    expect(isInsideElement('<A>x</A><A>needle</A>', 'A', 'needle')).toBe(true);
  });

  it('ignores a tag mentioned only in a JSX comment', () => {
    expect(isInsideElement('{/* <A> */}needle', 'A', 'needle')).toBe(false);
  });

  it('ignores a tag mentioned only in a line comment', () => {
    expect(isInsideElement('// <A>\nneedle', 'A', 'needle')).toBe(false);
  });

  it('does not match a tag whose name is a prefix of another', () => {
    expect(isInsideElement('<Pressables>needle', 'Pressable', 'needle')).toBe(false);
  });

  it('throws rather than passing when the needle is missing', () => {
    expect(() => isInsideElement('<A>x</A>', 'A', 'nope')).toThrow(/not found/);
  });

  it('throws rather than guessing when the needle repeats', () => {
    expect(() => isInsideElement('<A>needle</A>needle', 'A', 'needle')).toThrow(/not unique/);
  });
});
