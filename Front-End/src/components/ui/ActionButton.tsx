/** Button that shows icon + label on desktop, icon-only on mobile (with aria-label for a11y) */
type Props = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  variant?: 'primary' | 'danger' | 'default';
  'aria-label'?: string;
};

const variantClass = {
  primary: 'bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-light)]',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  default: 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]',
};

export default function ActionButton({ icon, label, onClick, type = 'button', className = '', variant = 'default', 'aria-label': ariaLabel }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition min-w-[2.5rem] md:min-w-0 md:px-4 ${variantClass[variant]} ${className}`}
    >
      <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
