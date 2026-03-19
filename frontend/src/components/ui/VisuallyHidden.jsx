import { cn } from '../../lib/utils';

const VisuallyHidden = ({ children, className, as: Component = 'span' }) => {
  return (
    <Component
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        '[clip:rect(0,0,0,0)]',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default VisuallyHidden;

export const VisuallyHiddenInput = ({ className, ...props }) => (
  <input
    className={cn(
      'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
      '[clip:rect(0,0,0,0)]',
      className
    )}
    {...props}
  />
);
