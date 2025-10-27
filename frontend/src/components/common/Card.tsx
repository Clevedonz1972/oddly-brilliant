import type { ReactNode } from 'react';

export type CardVariant = 'default' | 'cyan' | 'magenta' | 'purple' | 'green';
export type CardElevation = 'flat' | 'default' | 'elevated' | 'floating';

interface CardProps {
  children: ReactNode;
  interactive?: boolean;
  variant?: CardVariant;
  elevation?: CardElevation;
  className?: string;
  onClick?: () => void;
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
  className = '',
  onClick,
}: CardProps) => {
  const baseClass = interactive ? 'card-interactive' : 'card';

  // Variant classes (colored left border + glow)
  const variantClasses = {
    default: '',
    cyan: 'card-cyan',
    magenta: 'card-magenta',
    purple: 'card-purple',
    green: 'card-green',
  };

  // Elevation classes (shadow intensity)
  const elevationClasses = {
    flat: 'shadow-none',
    default: 'shadow-cyber-sm',
    elevated: 'shadow-cyber-md',
    floating: 'shadow-cyber-lg',
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${elevationClasses[elevation]} ${interactive ? 'min-h-[44px]' : ''} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive && onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};
