import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Button variants using Class Variance Authority (CVA)
 * Provides consistent styling with multiple variant options
 */
const buttonVariants = cva(
  // Base styles applied to all buttons
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background-dark',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        // Primary: Solid magenta with glow effect
        primary: [
          'bg-primary text-white',
          'hover:bg-primary-600',
          'shadow-[0_0_20px_rgba(198,42,185,0.4)]',
          'hover:shadow-[0_0_30px_rgba(198,42,185,0.6)]',
        ],
        // Secondary: Dark surface with border
        secondary: [
          'bg-surface text-white',
          'border border-border',
          'hover:border-primary hover:bg-surface-elevated',
        ],
        // Outline: Transparent with border
        outline: [
          'bg-transparent text-white',
          'border border-white/20',
          'hover:bg-white/10 hover:border-white',
        ],
        // Ghost: No background, subtle hover
        ghost: [
          'bg-transparent text-white',
          'hover:bg-white/10',
        ],
        // Destructive: Red for dangerous actions
        destructive: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'shadow-[0_0_15px_rgba(220,38,38,0.3)]',
          'hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]',
        ],
        // Glass: Glassmorphism effect
        glass: [
          'bg-white/10 text-white',
          'backdrop-blur-md border border-white/20',
          'hover:bg-white/20',
        ],
        // Link: Text only, underline on hover
        link: [
          'bg-transparent text-primary',
          'hover:text-primary-400 underline-offset-4 hover:underline',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-11 px-5 text-sm rounded-lg',
        lg: 'h-12 px-8 text-base rounded-lg',
        xl: 'h-14 px-10 text-lg rounded-xl',
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

/**
 * Button Component
 * 
 * @example
 * // Primary button
 * <Button>Click me</Button>
 * 
 * // Secondary large button
 * <Button variant="secondary" size="lg">Large Button</Button>
 * 
 * // Loading state
 * <Button isLoading>Saving...</Button>
 * 
 * // Icon button
 * <Button variant="ghost" size="icon"><Heart /></Button>
 */
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
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        
        {children}
        
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
