import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'success' | 'error';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helperText?: string;
}

/**
 * Reusable input component with label, icons, and state feedback
 * Cyberpunk-themed with dark styling and glow effects
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, size = 'md', leftIcon, rightIcon, helperText, className = '', ...props }, ref) => {
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    // Determine input state
    const state: InputState = error ? 'error' : success ? 'success' : 'default';

    // State classes
    const stateClasses = {
      default: 'input input-focus-glow',
      success: 'input border-success focus:shadow-glow-success',
      error: 'input input-error error-shake',
    };

    return (
      <div className="mb-4">
        {label && (
          <label
            className="block text-sm font-medium mb-2 text-text-cyber-secondary uppercase tracking-wide font-display"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-cyber-muted pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`${stateClasses[state]} ${sizeClasses[size]} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-cyber-muted pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-error flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        )}

        {success && !error && (
          <p className="mt-2 text-sm text-success flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </p>
        )}

        {helperText && !error && !success && (
          <p className="mt-2 text-sm text-text-cyber-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
