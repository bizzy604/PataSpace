/**
 * Purpose: Gate tests for the primitive cva variant maps — proves each variant
 *   resolves to the intended design token class.
 * Why important: The redesign's tokens reach the UI only through these class
 *   strings. A regression (a button that stops using bg-primary, a status
 *   badge that loses its tint) is caught here in the free node lane, no device
 *   render required.
 * Used by: pnpm --filter @pataspace/mobile test.
 */
import { buttonVariants, buttonTextVariants } from '../button-variants';
import { badgeVariants, badgeTextVariants } from '../badge-variants';
import { chipVariants, chipTextVariants } from '../chip-variants';
import { iconButtonVariants } from '../icon-button-variants';

describe('buttonVariants', () => {
  it('default fills with the primary token and pill shape rounds fully', () => {
    expect(buttonVariants({ variant: 'default' })).toContain('bg-primary');
    expect(buttonVariants({ shape: 'pill' })).toContain('rounded-full');
    expect(buttonVariants({ shape: 'rounded' })).toContain('rounded-[16px]');
  });

  it('danger uses the danger token, outline draws a 2pt primary border', () => {
    expect(buttonVariants({ variant: 'danger' })).toContain('bg-danger');
    const outline = buttonVariants({ variant: 'outline' });
    expect(outline).toContain('border-2');
    expect(outline).toContain('border-primary');
  });

  it('label text is Poppins (font-display) and inverts on solid fills', () => {
    const text = buttonTextVariants({ variant: 'default' });
    expect(text).toContain('font-display');
    expect(text).toContain('text-primary-foreground');
    expect(buttonTextVariants({ variant: 'outline' })).toContain('text-primary');
  });
});

describe('badgeVariants status pills', () => {
  it('tints the background low-opacity and colours the label to match', () => {
    expect(badgeVariants({ variant: 'success' })).toContain('bg-success/10');
    expect(badgeTextVariants({ variant: 'success' })).toContain('text-success');
    expect(badgeVariants({ variant: 'danger' })).toContain('bg-danger/10');
    expect(badgeTextVariants({ variant: 'danger' })).toContain('text-danger');
  });

  it('warning keeps a dark on-warning label for contrast on yellow', () => {
    expect(badgeVariants({ variant: 'warning' })).toContain('bg-warning/15');
    expect(badgeTextVariants({ variant: 'warning' })).toContain('text-on-warning');
  });
});

describe('chipVariants', () => {
  it('active fills teal with an inverted label; inactive stays muted', () => {
    expect(chipVariants({ active: true })).toContain('bg-primary');
    expect(chipTextVariants({ active: true })).toContain('text-primary-foreground');
    expect(chipVariants({ active: false })).toContain('bg-surface-subtle');
    expect(chipTextVariants({ active: false })).toContain('text-foreground');
  });
});

describe('iconButtonVariants', () => {
  it('maps each variant to its container token', () => {
    expect(iconButtonVariants({ variant: 'accent' })).toContain('bg-primary');
    expect(iconButtonVariants({ variant: 'subtle' })).toContain('bg-secondary');
    expect(iconButtonVariants({ variant: 'outline' })).toContain('border-primary');
    expect(iconButtonVariants({ variant: 'dark' })).toContain('bg-surface-inverse');
  });
});
