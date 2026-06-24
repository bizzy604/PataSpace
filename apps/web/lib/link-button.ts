import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const linkButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-lg border text-sm font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md',
        outline:
          'border-border bg-card text-foreground shadow-sm hover:bg-muted hover:shadow-md',
        ghost: 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
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
