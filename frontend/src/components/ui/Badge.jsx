import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-semibold uppercase tracking-wider transition-colors',
  ],
  {
    variants: {
      variant: {
        default: 'bg-dark-100 text-dark-700',
        primary: 'bg-primary/20 text-primary border border-primary/30',
        secondary: 'bg-surface text-text-inverse-secondary border border-border',
        success: 'bg-success/15 text-success-dark border border-success/30',
        warning: 'bg-warning/15 text-warning-dark border border-warning/30',
        error: 'bg-error/15 text-error-dark border border-error/30',
        info: 'bg-info/15 text-info-dark border border-info/30',
        gold: 'bg-primary/20 text-primary border border-primary/40',
        glass: 'bg-white/10 text-white border border-white/20 backdrop-blur-sm',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 rounded',
        md: 'text-xs px-2.5 py-1 rounded-md',
        lg: 'text-sm px-3 py-1.5 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Badge = ({ className, variant, size, children, ...props }) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
