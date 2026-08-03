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
    // `shadow-none` on the shadowless variants is load-bearing: shadow-*
    // utilities set --tw-shadow* CSS variables, and css-interop 0.2.6 crashes a
    // mounted component that only starts setting variables on a later render.
    // Badges take a dynamic `variant` (e.g. confirmed ? 'success' : 'warning'),
    // so shadow presence has to be uniform across the map. Visually inert.
    // See lib/__tests__/css-interop-upgrade.test.ts.
    variant: {
      default: 'bg-primary shadow-card',
      secondary: 'bg-secondary shadow-none',
      outline: 'border border-border bg-card shadow-none',
      dark: 'bg-surface-inverse shadow-none',
      success: 'bg-success/10 shadow-none',
      warning: 'bg-warning/15 shadow-none',
      danger: 'bg-danger/10 shadow-none',
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
