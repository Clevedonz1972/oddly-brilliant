import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'text' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  'aria-label'?: string;
}

/**
 * Reusable button component with multiple variants, sizes, and icon support
 * Cyberpunk-themed with glow effects and smooth transitions
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  iconOnly = false,
  className = '',
  ...props
}: ButtonProps) => {
  // Variant classes - Enhanced with ghost, link, and text variants
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'border-2 border-transparent text-cyan-500 hover:bg-cyber-elevated hover:border-cyan-500/30 hover:shadow-glow-cyan transition-all duration-300 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-cyber-dark',
    link: 'border-none text-cyan-500 hover:text-cyan-400 hover:underline underline-offset-4 transition-all duration-200 shadow-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-cyber-dark rounded-sm px-1',
    text: 'border-none text-text-cyber-primary hover:text-cyan-500 hover:bg-cyber-elevated/50 transition-all duration-200 shadow-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-cyber-dark',
    success: 'border-2 border-success text-success hover:bg-success hover:text-cyber-dark shadow-glow-success transition-all duration-300 focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-cyber-dark',
    danger: 'border-2 border-error text-error hover:bg-error hover:text-white shadow-glow-error transition-all duration-300 focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-cyber-dark',
  };

  // Size classes - Added xl and icon-only variants
  const sizeClasses = iconOnly ? {
    sm: 'p-2 min-h-[36px] min-w-[36px] rounded-md',
    md: 'p-2.5 min-h-[44px] min-w-[44px] rounded-md',
    lg: 'p-3 min-h-[52px] min-w-[52px] rounded-lg',
    xl: 'p-4 min-h-[60px] min-w-[60px] rounded-lg',
  } : {
    sm: 'px-4 py-2 text-sm min-h-[36px] rounded-md',
    md: 'px-6 py-3 text-base min-h-[44px] rounded-md',
    lg: 'px-8 py-4 text-lg min-h-[52px] rounded-lg',
    xl: 'px-10 py-5 text-xl min-h-[60px] rounded-xl',
  };

  // Loading spinner size based on button size
  const spinnerSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7',
  };

  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} btn-ripple font-display font-semibold inline-flex items-center justify-center ${iconOnly ? '' : 'gap-2'} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className={`motion-safe:animate-spin ${spinnerSizeClasses[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {!iconOnly && <span>Loading...</span>}
          {iconOnly && <span className="sr-only">Loading</span>}
        </>
      ) : iconOnly ? (
        <>
          {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
          {!icon && children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
        </>
      )}
    </button>
  );
};
