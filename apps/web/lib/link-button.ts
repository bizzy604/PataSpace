import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const linkButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-semibold tracking-[-0.01em] whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-200 active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft-sm hover:-translate-y-px hover:bg-[var(--hig-color-accent-hover)] hover:shadow-soft-md',
        outline:
          'border-separator bg-card text-foreground shadow-soft-sm backdrop-blur-xl hover:-translate-y-px hover:border-separator-strong hover:bg-surface-elevated',
        ghost: 'text-foreground-secondary hover:bg-fill-soft hover:text-foreground',
      },
      size: {
        default: 'h-12 gap-2 px-6',
        sm: 'h-10 gap-1.5 px-4 text-sm',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  },
);

export type LinkButtonVariantProps = VariantProps<typeof linkButtonVariants>;

export function linkButtonClass(options?: LinkButtonVariantProps, className?: string) {
  return cn(linkButtonVariants(options), className);
}
