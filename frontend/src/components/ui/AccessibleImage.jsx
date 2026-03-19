import { useState } from 'react';
import { cn } from '../../lib/utils';

const AccessibleImage = ({
  src,
  alt,
  className,
  loadingClassName = 'animate-shimmer',
  fallbackText = 'Imagen no disponible',
  aspectRatio = 'aspect-square',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-background-cream text-primary/30',
          aspectRatio,
          className
        )}
        role="img"
        aria-label={fallbackText}
      >
        <span className="text-lg font-bold uppercase italic">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', aspectRatio, className)}>
      {!isLoaded && (
        <div 
          className={cn('absolute inset-0 bg-gray-200', loadingClassName)}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};

export default AccessibleImage;
