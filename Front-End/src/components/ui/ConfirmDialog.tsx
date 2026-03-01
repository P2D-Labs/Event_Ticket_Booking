import { useEffect } from 'react';
import { IconClose } from '../icons/PanelIcons';

export type ConfirmDialogVariant = 'danger' | 'primary' | 'neutral';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
};

const variantStyles: Record<ConfirmDialogVariant, string> = {
  danger: 'bg-red-500/90 hover:bg-red-500 text-white border-transparent',
  primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-[var(--color-bg)] border-transparent',
  neutral: 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]',
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xl">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-[var(--color-border)]">
          <h2 id="confirm-dialog-title" className="font-header text-lg text-[var(--color-text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <p id="confirm-dialog-desc" className="p-4 text-sm text-[var(--color-text-muted)]">
          {message}
        </p>
        <div className="flex justify-end gap-3 p-4 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center min-h-[36px] px-4 py-2 text-sm font-medium rounded border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center min-h-[36px] px-4 py-2 text-sm font-medium rounded border ${variantStyles[variant]} disabled:opacity-50`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
