import { cn } from '../../lib/utils';

/**
 * Skeleton - Loading placeholder with shimmer effect
 * 
 * @example
 * // Basic skeleton
 * <Skeleton className="h-4 w-full" />
 * 
 * // Avatar skeleton
 * <Skeleton variant="circular" className="w-12 h-12" />
 * 
 * // Card skeleton
 * <Skeleton variant="rectangular" className="h-40 w-full" />
 * 
 * // Text block
 * <Skeleton.Text lines={3} />
 */
const Skeleton = ({ className, variant = 'rectangular', ...props }) => {
  const variants = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };
  
  return (
    <div
      className={cn(
        'shimmer',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

/**
 * SkeletonText - Multiple lines of text skeleton
 */
const SkeletonText = ({ lines = 3, className, lastLineWidth = '60%' }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard - Pre-built card skeleton
 */
const SkeletonCard = ({ className, showImage = true }) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {showImage && (
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      )}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

/**
 * SkeletonAvatar - Avatar placeholder
 */
const SkeletonAvatar = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };
  
  return (
    <Skeleton
      variant="circular"
      className={cn(sizes[size], className)}
    />
  );
};

/**
 * SkeletonButton - Button placeholder
 */
const SkeletonButton = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-9 w-20',
    md: 'h-11 w-28',
    lg: 'h-12 w-36',
  };
  
  return (
    <Skeleton
      className={cn('rounded-lg', sizes[size], className)}
    />
  );
};

// Attach sub-components to main Skeleton
Skeleton.Text = SkeletonText;
Skeleton.Card = SkeletonCard;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Button = SkeletonButton;

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonButton };
