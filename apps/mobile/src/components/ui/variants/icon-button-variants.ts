/**
 * Purpose: Pure cva class maps for the IconButton primitive (circular icon
 *   containers) from DESIGN.md's "secondary actions in circular containers".
 * Why important: Keeps the icon-button token mapping testable alongside the
 *   other primitives.
 * Used by: components/ui/icon-button.tsx and variants/__tests__/variants.test.ts.
 */
import { cva, type VariantProps } from 'class-variance-authority';

export const iconButtonVariants = cva(
  'h-12 w-12 items-center justify-center rounded-full border active:opacity-90',
  {
    variants: {
      variant: {
        accent: 'border-transparent bg-primary shadow-card',
        subtle: 'border-border bg-secondary',
        outline: 'border-2 border-primary bg-transparent',
        dark: 'border-transparent bg-surface-inverse shadow-floating',
      },
    },
    defaultVariants: {
      variant: 'subtle',
    },
  },
);

export const iconButtonTextVariants = cva('font-body-medium text-sm tracking-[0.2px]', {
  variants: {
    variant: {
      accent: 'text-primary-foreground',
      subtle: 'text-foreground',
      outline: 'text-primary',
      dark: 'text-primary-foreground',
    },
  },
  defaultVariants: {
    variant: 'subtle',
  },
});

export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;
