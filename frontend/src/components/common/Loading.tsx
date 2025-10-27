export type LoadingSize = 'sm' | 'md' | 'lg';
export type LoadingVariant = 'fullscreen' | 'inline';

interface LoadingProps {
  message?: string;
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
}

/**
 * Loading spinner component
 * Cyberpunk-themed with glowing spinner in multiple sizes and variants
 */
export const Loading = ({
  message = 'Loading...',
  size = 'md',
  variant = 'fullscreen',
  className = ''
}: LoadingProps) => {
  // Size classes for spinner
  const spinnerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  // Container classes based on variant
  const containerClasses = variant === 'fullscreen'
    ? 'flex flex-col items-center justify-center min-h-[400px] page-fade-in'
    : 'flex items-center gap-3';

  // Message size classes
  const messageSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`spinner-enhanced ${spinnerSizeClasses[size]}`}></div>
      {message && (
        <p
          className={`${messageSizeClasses[size]} ${variant === 'fullscreen' ? 'mt-6' : ''} text-text-cyber-secondary uppercase tracking-wide terminal-cursor font-display`}
        >
          {message}
        </p>
      )}
    </div>
  );
};
