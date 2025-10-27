interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'button';
  width?: string;
  height?: string;
  className?: string;
}

/**
 * Loading skeleton component for content placeholders
 * Shows shimmer animation during data loading
 */
export const LoadingSkeleton = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
}: LoadingSkeletonProps) => {
  // Variant-specific default dimensions
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'h-12 w-12 rounded-full',
    rectangular: 'h-32 w-full rounded-lg',
    card: 'h-64 w-full rounded-lg',
    button: 'h-11 w-32 rounded-md',
  };

  const baseClasses = 'shimmer bg-cyber-elevated animate-shimmer bg-[length:200%_100%]';
  const dimensionClasses = variantClasses[variant];

  const customStyle = {
    ...(width && { width }),
    ...(height && { height }),
  };

  return (
    <div
      className={`${baseClasses} ${dimensionClasses} ${className}`}
      style={customStyle}
      role="status"
      aria-label="Loading..."
    />
  );
};

/**
 * Pre-composed skeleton variants for common use cases
 */

/**
 * Text line skeleton with optional title variant
 */
export const TextSkeleton = ({
  lines = 3,
  title = false,
  className = ''
}: {
  lines?: number;
  title?: boolean;
  className?: string;
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && <LoadingSkeleton variant="text" width="60%" height="1.5rem" />}
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Card skeleton with image, title, and text
 */
export const CardSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`card ${className}`}>
      <LoadingSkeleton variant="rectangular" height="12rem" className="mb-4" />
      <LoadingSkeleton variant="text" width="70%" height="1.5rem" className="mb-3" />
      <TextSkeleton lines={3} />
    </div>
  );
};

/**
 * List item skeleton with avatar and text
 */
export const ListItemSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <LoadingSkeleton variant="circular" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" width="40%" />
        <LoadingSkeleton variant="text" width="90%" />
      </div>
    </div>
  );
};

/**
 * Table row skeleton
 */
export const TableRowSkeleton = ({
  columns = 4,
  className = ''
}: {
  columns?: number;
  className?: string;
}) => {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          variant="text"
          width={i === 0 ? '30%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Button skeleton
 */
export const ButtonSkeleton = ({
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const heights = {
    sm: '2.25rem',  // 36px
    md: '2.75rem',  // 44px
    lg: '3.25rem',  // 52px
  };

  return (
    <LoadingSkeleton
      variant="button"
      height={heights[size]}
      className={className}
    />
  );
};
