import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-bold uppercase tracking-wider transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background-dark',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98] hover-lift press-effect',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-dark-900',
          'hover:bg-primary-dark hover:shadow-gold',
        ],
        'primary-glow': [
          'bg-primary text-dark-900',
          'shadow-gold hover:shadow-gold-lg',
        ],
        secondary: [
          'bg-surface text-white',
          'border border-border hover:border-primary',
          'hover:bg-surface-elevated hover:shadow-gold-sm',
        ],
        outline: [
          'bg-transparent text-primary',
          'border border-primary hover:bg-primary/10',
        ],
        'outline-light': [
          'bg-transparent text-white',
          'border border-white/30 hover:border-white hover:bg-white/10',
        ],
        ghost: [
          'bg-transparent text-white hover:bg-white/10',
        ],
        'ghost-gold': [
          'bg-transparent text-primary hover:bg-primary/10',
        ],
        destructive: [
          'bg-red-600 text-white',
          'hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)]',
        ],
        glass: [
          'bg-white/10 text-white backdrop-blur-md border border-white/20',
          'hover:bg-white/20',
        ],
        link: [
          'bg-transparent text-primary underline-offset-4 hover:underline',
        ],
      },
      size: {
        sm: 'h-9 px-4 text-xs rounded-md',
        md: 'h-11 px-6 text-sm rounded-lg',
        lg: 'h-12 px-8 text-sm rounded-lg',
        xl: 'h-14 px-10 text-base rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = forwardRef(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        aria-label={ariaLabel}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Cargando...</span>
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
