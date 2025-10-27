import type { ReactNode } from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeStyle = 'outline' | 'solid';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: BadgeStyle;
  pulse?: boolean;
  className?: string;
}

/**
 * Badge component for status indicators, labels, and tags
 * Cyberpunk-themed with glow effects
 */
export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  style = 'outline',
  pulse = false,
  className = '',
}: BadgeProps) => {
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // Variant classes for outline style
  const outlineVariantClasses = {
    primary: 'border-cyan-500 text-cyan-500 shadow-glow-cyan',
    secondary: 'border-magenta-500 text-magenta-500 shadow-glow-magenta',
    success: 'border-success text-success shadow-glow-success',
    warning: 'border-warning text-warning shadow-glow-warning',
    error: 'border-error text-error shadow-glow-error',
    neutral: 'border-border text-text-cyber-secondary',
  };

  // Variant classes for solid style
  const solidVariantClasses = {
    primary: 'bg-cyan-500 text-cyber-dark border-cyan-500 shadow-glow-cyan',
    secondary: 'bg-magenta-500 text-white border-magenta-500 shadow-glow-magenta',
    success: 'bg-success text-cyber-dark border-success shadow-glow-success',
    warning: 'bg-warning text-cyber-dark border-warning shadow-glow-warning',
    error: 'bg-error text-white border-error shadow-glow-error',
    neutral: 'bg-cyber-elevated text-text-cyber-primary border-border',
  };

  const variantClasses = style === 'outline'
    ? outlineVariantClasses[variant]
    : solidVariantClasses[variant];

  const baseClasses = 'inline-flex items-center gap-1 rounded font-display font-semibold border-2 uppercase tracking-wide transition-all duration-200';

  const pulseClass = pulse ? 'badge-pulse' : '';

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses} ${pulseClass} ${className}`}
    >
      {children}
    </span>
  );
};
