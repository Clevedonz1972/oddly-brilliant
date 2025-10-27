import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
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
  className = '',
  ...props
}: ButtonProps) => {
  // Variant classes
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    success: 'border-2 border-success text-success hover:bg-success hover:text-cyber-dark shadow-glow-success transition-all duration-300',
    danger: 'border-2 border-error text-error hover:bg-error hover:text-white shadow-glow-error transition-all duration-300',
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[36px] rounded-md',
    md: 'px-6 py-3 text-base min-h-[44px] rounded-md',
    lg: 'px-8 py-4 text-lg min-h-[52px] rounded-lg',
  };

  // Loading spinner size based on button size
  const spinnerSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} btn-ripple font-display font-semibold inline-flex items-center justify-center gap-2 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className={`motion-safe:animate-spin ${spinnerSizeClasses[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
