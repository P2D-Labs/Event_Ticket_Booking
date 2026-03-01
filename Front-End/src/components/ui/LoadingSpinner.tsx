/**
 * Centered loading indicator. Replace the inner content with Lottie or custom animation later.
 */
type Props = {
  /** Optional message below the spinner */
  message?: string;
  /** Use full viewport height (e.g. for page-level loading) */
  fullScreen?: boolean;
  className?: string;
};

export default function LoadingSpinner({ message, fullScreen = false, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? 'min-h-[60vh]' : 'py-12'} ${className}`}
      role="status"
      aria-label="Loading"
    >
      {/* Spinner: swap for Lottie or other animation later */}
      <div
        className="w-10 h-10 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin"
        aria-hidden
      />
      {message && (
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      )}
    </div>
  );
}
