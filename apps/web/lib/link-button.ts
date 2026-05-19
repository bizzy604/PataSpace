import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const linkButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center border text-sm font-semibold whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-150 active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:shadow-md',
        outline:
          'border-border bg-card text-foreground shadow-sm hover:-translate-y-px hover:shadow-md hover:bg-muted',
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
