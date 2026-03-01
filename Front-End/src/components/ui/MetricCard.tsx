type MetricCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; up: boolean };
  barPercent?: number; // 0-100 for progress bar
  barColor?: 'primary' | 'green' | 'orange' | 'red';
};

const barColors = {
  primary: 'bg-[var(--color-primary)]',
  green: 'bg-green-500',
  orange: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function MetricCard({ title, value, icon, trend, barPercent = 0, barColor = 'primary' }: MetricCardProps) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.up ? 'text-green-400' : 'text-red-400'}`}>
            {trend.up ? '↑' : '↓'}{trend.value}
          </span>
        )}
      </div>
      <p className="font-header text-2xl md:text-3xl text-[var(--color-text)] mt-3">{value}</p>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">{title}</p>
      {barPercent > 0 && (
        <div className="mt-3 h-1.5 w-full bg-[var(--color-bg-input)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColors[barColor]}`}
            style={{ width: `${Math.min(100, barPercent)}%` }}
          />
        </div>
      )}
    </div>
  );
}
