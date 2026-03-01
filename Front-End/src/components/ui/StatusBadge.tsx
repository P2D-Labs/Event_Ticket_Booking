/** Consistent status badges across admin/organizer panels */
type Variant = 'success' | 'warning' | 'danger' | 'neutral';

const styles: Record<Variant, string> = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30',
  neutral: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)]',
};

export default function StatusBadge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center justify-center min-h-[28px] px-2.5 py-1 text-xs font-medium rounded border leading-none ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function statusToVariant(status: string): Variant {
  const u = status.toUpperCase();
  if (['APPROVED', 'CONFIRMED', 'ACTIVE'].includes(u)) return 'success';
  if (['PENDING', 'DRAFT'].includes(u)) return 'warning';
  if (['REJECTED', 'CANCELLED', 'INACTIVE', 'EXPIRED'].includes(u)) return 'danger';
  return 'neutral';
}
