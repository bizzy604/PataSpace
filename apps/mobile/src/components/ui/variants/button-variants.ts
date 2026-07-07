/**
 * Purpose: Pure cva class maps for the Button primitive (no React/RN imports),
 *   so the variant -> className mapping is unit-testable in the node jest lane.
 * Why important: The design tokens reach the UI through these strings; a test
 *   here catches a wrong token (e.g. a button that stops using bg-primary)
 *   without needing a device render.
 * Used by: components/ui/button.tsx and variants/__tests__/variants.test.ts.
 */
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'items-center justify-center border px-5 active:opacity-90',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary shadow-card',
        secondary: 'border-border bg-secondary',
        outline: 'border-2 border-primary bg-transparent',
        dark: 'border-transparent bg-surface-inverse shadow-floating',
        danger: 'border-transparent bg-danger shadow-card',
        ghost: 'border-transparent bg-transparent',
      },
      size: {
        sm: 'min-h-10 px-4 py-2.5',
        default: 'min-h-12 py-3',
        lg: 'min-h-14 px-6 py-3.5',
      },
      shape: {
        rounded: 'rounded-[16px]',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'rounded',
    },
  },
);

export const buttonTextVariants = cva('text-center font-display tracking-[-0.2px]', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      outline: 'text-primary',
      dark: 'text-primary-foreground',
      danger: 'text-primary-foreground',
      ghost: 'text-muted-foreground',
    },
    size: {
      sm: 'text-label-md',
      default: 'text-body-md',
      lg: 'text-body-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
