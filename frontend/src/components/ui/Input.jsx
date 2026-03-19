import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

const inputVariants = cva(
  [
    'w-full rounded-lg transition-all duration-200',
    'bg-surface border text-white placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'border-border',
        light: 'bg-white/10 border-white/20 text-white placeholder:text-white/50',
        error: 'border-error focus:ring-error/50 bg-error/5',
        success: 'border-success focus:ring-success/50',
        gold: 'border-primary/50 focus:border-primary',
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
            className="block text-sm font-medium text-text-inverse-secondary mb-1.5"
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p 
            id={`${inputId}-error`}
            className={cn(
              "mt-1.5 text-sm",
              hasError ? "text-error" : "text-text-muted"
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
