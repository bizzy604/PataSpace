/**
 * Purpose: Gate-test that the unlock affordances respect a Taken listing —
 *   the details screen does not route a taken house into the paywall, and the
 *   unlock sheet handles the 'unavailable' result distinctly from a shortfall.
 * Why important: The failure this guards is a tenant topping up credits for a
 *   house that is already gone. The API answers 410 LISTING_UNAVAILABLE and
 *   charges nothing, so any UI that reads that as "insufficient credits" sends
 *   someone to buy credits they do not need. That bug is invisible in a
 *   screenshot. The mobile jest lane transforms `.ts` only and has no renderer,
 *   so these read the screens as source, the same way
 *   listing-card-tap-target.test.ts does.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { isInsideElement, stripComments } from '../jsx-nesting';

const screensDir = path.resolve(__dirname, '../../screens');
const detailsSource = fs.readFileSync(path.join(screensDir, 'ListingDetailsScreen.tsx'), 'utf8');const unlockSource = fs.readFileSync(path.join(screensDir, 'UnlockListingScreen.tsx'), 'utf8');
const providerPath = path.resolve(__dirname, '../../features/mobile-app/mobile-app-provider.tsx');
const providerSource = stripComments(fs.readFileSync(providerPath, 'utf8'));

describe('listing details unlock CTA', () => {
  const source = stripComments(detailsSource);

  it('derives taken from the shared predicate rather than a loose string check', () => {
    expect(source).toContain('isListingTaken(listing.status)');
  });

  it('branches the bottom bar on taken', () => {
    expect(source).toContain('taken && !unlocked');
  });

  it('renders a disabled CTA for a taken house', () => {
    expect(source).toContain('disabled label="House Taken"');
  });

  // The whole point: no Link means no route into the paywall.
  it('keeps the taken CTA outside any Link', () => {
    expect(isInsideElement(detailsSource, 'Link', 'label="House Taken"')).toBe(false);
  });

  it('still routes an unlocked viewer to their contact', () => {
    expect(source).toContain('contactRevealedHref(listing.id)');
  });
});

describe('unlock sheet taken handling', () => {
  const source = stripComments(unlockSource);

  it('blocks the charge path before calling the API', () => {
    expect(source).toContain('if (taken)');
  });

  it('handles the unavailable result from the provider', () => {
    expect(source).toContain("result === 'unavailable'");
  });

  it('tells the user they were not charged', () => {
    expect(source).toContain('You were not charged');
  });

  // Regression: 'unavailable' must not fall through to the top-up modal.
  it('does not open the insufficient-credits modal for a taken house', () => {
    const takenBranch = source.slice(source.indexOf("result === 'unavailable'"));
    const nextReturn = takenBranch.indexOf('return;');
    expect(takenBranch.slice(0, nextReturn)).not.toContain('setShowInsufficient(true)');
  });

  it('no longer blames the balance in the generic failure message', () => {
    expect(source).not.toContain('Check your balance and try again');
  });
});

describe('provider unlock result', () => {
  it('maps the 410 code to unavailable', () => {
    expect(providerSource).toContain("error.code === 'LISTING_UNAVAILABLE'");
    expect(providerSource).toContain("return 'unavailable'");
  });

  it('keeps insufficient distinct from unavailable', () => {
    expect(providerSource).toContain("error.code === 'INSUFFICIENT_CREDITS'");
  });

  it('guards locally so a taken house never spends a request', () => {
    expect(providerSource).toContain("if (isListingTaken(listing.status)) return 'unavailable'");
  });

  // A missing listing is not a balance problem; the old code returned
  // 'insufficient' here and would have opened the top-up modal.
  it('does not report a missing listing as insufficient', () => {
    expect(providerSource).toContain("if (!listing) return 'error'");
  });

  it('declares unavailable in the exported result union', () => {
    expect(providerSource).toContain('UnlockAttemptResult');
    const union = providerSource.slice(
      providerSource.indexOf('export type UnlockAttemptResult'),
      providerSource.indexOf('type MobileAppContextValue'),
    );
    expect(union).toContain("'unavailable'");
    expect(union).toContain("'insufficient'");
  });
});
