interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Error message component with optional retry button
 * Cyberpunk-themed with red glow
 */
export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-[var(--error)] text-6xl mb-4 animate-pulse">⚠</div>
        <h3
          className="text-xl font-semibold text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Oops! Something went wrong
        </h3>
        <p className="text-[var(--text-secondary)] mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary shadow-[0_0_20px_var(--primary-glow)]"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
