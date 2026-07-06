/**
 * Purpose: Pure cva class maps for the Badge primitive, including the new
 *   status pills (low-opacity tint + high-contrast text) from DESIGN.md.
 * Why important: Status colours must stay legible; tests assert each status
 *   variant tints its own colour rather than drifting to a solid fill.
 * Used by: components/ui/badge.tsx and variants/__tests__/variants.test.ts.
 */
import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva('rounded-full px-3 py-1.5', {
  variants: {
    variant: {
      default: 'bg-primary shadow-card',
      secondary: 'bg-secondary',
      outline: 'border border-border bg-card',
      dark: 'bg-surface-inverse',
      success: 'bg-success/10',
      warning: 'bg-warning/15',
      danger: 'bg-danger/10',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const badgeTextVariants = cva('text-[11px] font-body-bold uppercase tracking-[1.5px]', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      outline: 'text-muted-foreground',
      dark: 'text-primary-foreground',
      success: 'text-success',
      warning: 'text-on-warning',
      danger: 'text-danger',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
