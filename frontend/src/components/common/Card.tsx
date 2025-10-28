import type { ReactNode } from 'react';

export type CardVariant = 'default' | 'cyan' | 'magenta' | 'purple' | 'green' | 'gradient-cyber' | 'gradient-pink' | 'bordered';
export type CardElevation = 'flat' | 'default' | 'elevated' | 'floating';
export type CardStyle = 'default' | 'outline' | 'filled' | 'glass';

// Export types
export type { CardProps };

interface CardProps {
  children: ReactNode;
  interactive?: boolean;
  variant?: CardVariant;
  elevation?: CardElevation;
  style?: CardStyle;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

/**
 * Reusable card component for content sections
 * Cyberpunk-themed with colored accents and elevation levels
 */
export const Card = ({
  children,
  interactive = false,
  variant = 'default',
  elevation = 'default',
  style = 'default',
  loading = false,
  className = '',
  onClick,
  ...props
}: CardProps) => {
  const baseClass = interactive ? 'card-interactive' : 'card';

  // Variant classes (colored left border + glow)
  const variantClasses = {
    default: '',
    cyan: 'card-cyan',
    magenta: 'card-magenta',
    purple: 'card-purple',
    green: 'card-green',
    'gradient-cyber': 'border-2 border-transparent bg-gradient-to-br from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 transition-all duration-300',
    'gradient-pink': 'border-2 border-transparent bg-gradient-to-br from-magenta-500/10 to-error/10 hover:from-magenta-500/20 hover:to-error/20 transition-all duration-300',
    'bordered': 'border-2 border-border hover:border-cyan-500/50 transition-all duration-300',
  };

  // Style classes
  const styleClasses = {
    default: '',
    outline: 'bg-transparent border-2 border-border',
    filled: 'bg-cyber-elevated',
    glass: 'bg-cyber-dark/50 backdrop-blur-lg border border-cyan-500/20',
  };

  // Elevation classes (shadow intensity)
  const elevationClasses = {
    flat: 'shadow-none',
    default: 'shadow-cyber-sm',
    elevated: 'shadow-cyber-md',
    floating: 'shadow-cyber-lg motion-safe:hover:shadow-cyber-xl motion-safe:hover:-translate-y-1',
  };

  // Focus classes for interactive cards
  const focusClasses = interactive
    ? 'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-cyber-dark focus:shadow-cyber-lg'
    : '';

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${styleClasses[style]} ${elevationClasses[elevation]} ${focusClasses} ${interactive ? 'min-h-[44px]' : ''} ${loading ? 'animate-pulse pointer-events-none' : ''} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive && onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
          <span className="sr-only">Loading</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
};
