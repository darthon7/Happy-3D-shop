import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Card - Root container component
 */
const Card = forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-white border-dark-100',
    dark: 'bg-surface border-border',
    glass: 'bg-white/10 backdrop-blur-xl border-white/10',
    elevated: 'bg-surface border-border shadow-xl shadow-black/20',
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-200',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Card.displayName = 'Card';

/**
 * CardHeader - Header section with optional bottom border
 */
const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Main heading of the card
 */
const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Secondary text below title
 */
const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-text-muted', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContent - Main content area
 */
const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * CardFooter - Footer section, typically for actions
 */
const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
