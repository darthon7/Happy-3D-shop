import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

/**
 * Input variants using CVA
 */
const inputVariants = cva(
  // Base styles
  [
    'w-full rounded-lg transition-all duration-200',
    'bg-surface border text-white placeholder-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'border-border focus:ring-primary',
        error: 'border-red-500 focus:ring-red-500 bg-red-500/5',
        success: 'border-green-500 focus:ring-green-500',
      },
      inputSize: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

/**
 * Input Component
 * 
 * @example
 * // Basic input
 * <Input placeholder="Enter your email" />
 * 
 * // With label and error
 * <Input 
 *   label="Email"
 *   error="Please enter a valid email"
 *   placeholder="you@example.com"
 * />
 * 
 * // With left icon
 * <Input leftIcon={<Mail />} placeholder="Email" />
 */
const Input = forwardRef(
  (
    {
      className,
      variant,
      inputSize,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              inputVariants({ 
                variant: hasError ? 'error' : variant, 
                inputSize,
              }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            {...props}
          />
          
          {rightIcon && !hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
          
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p 
            id={`${inputId}-error`}
            className={cn(
              "mt-1.5 text-sm",
              hasError ? "text-red-500" : "text-text-muted"
            )}
            role={hasError ? "alert" : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
