import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Badge variants using CVA
 */
const badgeVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center',
    'font-semibold transition-colors',
  ],
  {
    variants: {
      variant: {
        default: 'bg-dark-100 text-dark-700',
        primary: 'bg-primary/20 text-primary-400 border border-primary/30',
        secondary: 'bg-surface text-text-secondary border border-border',
        success: 'bg-green-500/20 text-green-400 border border-green-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/30',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        // Solid variants
        'solid-primary': 'bg-primary text-white',
        'solid-success': 'bg-green-600 text-white',
        'solid-warning': 'bg-amber-600 text-white',
        'solid-error': 'bg-red-600 text-white',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 rounded',
        md: 'text-xs px-2.5 py-1 rounded-md',
        lg: 'text-sm px-3 py-1.5 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/**
 * Badge Component
 * 
 * @example
 * // Default badge
 * <Badge>New</Badge>
 * 
 * // Status badges
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error">Expired</Badge>
 * 
 * // Different sizes
 * <Badge size="lg" variant="primary">Featured</Badge>
 */
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
