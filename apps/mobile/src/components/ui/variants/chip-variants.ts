/**
 * Purpose: Pure cva class maps for the Chip primitive — full-pill filter
 *   chips whose active state fills teal per DESIGN.md.
 * Why important: Chips are the browse/filter workhorse; the active/inactive
 *   contrast is the whole point, so it is worth a deterministic test.
 * Used by: components/ui/chip.tsx and variants/__tests__/variants.test.ts.
 */
import { cva, type VariantProps } from 'class-variance-authority';

export const chipVariants = cva(
  'flex-row items-center justify-center rounded-full border px-4 py-2 active:opacity-90',
  {
    variants: {
      active: {
        true: 'border-transparent bg-primary',
        false: 'border-border bg-surface-subtle',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export const chipTextVariants = cva('font-body-medium text-label-md', {
  variants: {
    active: {
      true: 'text-primary-foreground',
      false: 'text-foreground',
    },
  },
  defaultVariants: {
    active: false,
  },
});

export type ChipVariantProps = VariantProps<typeof chipVariants>;
