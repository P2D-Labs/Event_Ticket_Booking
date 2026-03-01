import { IconSort } from '../icons/PanelIcons';

type Props = {
  sortKey: string | null;
  thisKey: string;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
};

export default function SortableTh({ sortKey, thisKey, sortOrder, onSort, children, className = '', align = 'left' }: Props) {
  const isActive = sortKey === thisKey;
  return (
    <th className={`p-3 font-medium text-[var(--color-text-muted)] ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(thisKey)}
        className={`inline-flex items-center gap-1 w-full ${align === 'right' ? 'justify-end' : 'justify-start'} hover:text-[var(--color-primary)] transition`}
      >
        {children}
        <span className="inline-flex opacity-70" aria-hidden>
          <IconSort />
        </span>
        {isActive && <span className="text-[var(--color-primary)]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}
