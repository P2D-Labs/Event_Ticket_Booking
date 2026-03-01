import { IconSort, IconChevronLeft, IconChevronRight, IconChevronDoubleLeft, IconChevronDoubleRight } from '../icons/PanelIcons';
import LoadingSpinner from './LoadingSpinner';

export type Column<T> = {
  key: string;
  label: string;
  sortKey?: string;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  // Pagination
  page?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
};

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  sortKey,
  sortOrder = 'desc',
  onSort,
  loading,
  emptyMessage = 'No data.',
  page = 1,
  total = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}: DataTableProps<T>) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 font-medium text-[var(--color-text-muted)]"
                >
                  {col.sortKey && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.sortKey!)}
                      className="flex items-center gap-1 hover:text-[var(--color-primary)]"
                    >
                      {col.label}
                      <span className="inline-flex flex-col opacity-70">
                        <IconSort />
                      </span>
                      {sortKey === col.sortKey && (
                        <span className="text-[var(--color-primary)]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <LoadingSpinner message="Loading…" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-elevated)]/50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-[var(--color-text)]">
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && onPageChange && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-muted)]">
              Showing {from} to {to} of {total}
            </span>
            {onLimitChange && (
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] text-sm px-2 py-1 rounded"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onPageChange(1); }} disabled={page <= 1 || loading} className="p-2 border border-[var(--color-border)] rounded disabled:opacity-40 hover:bg-[var(--color-bg-elevated)] inline-flex items-center justify-center" aria-label="First page">
              <IconChevronDoubleLeft />
            </button>
            <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onPageChange(page - 1); }} disabled={page <= 1 || loading} className="p-2 border border-[var(--color-border)] rounded disabled:opacity-40 hover:bg-[var(--color-bg-elevated)] inline-flex items-center justify-center" aria-label="Previous page">
              <IconChevronLeft />
            </button>
            <span className="px-3 py-1 text-sm text-[var(--color-text-muted)]">
              Page {page} of {totalPages}
            </span>
            <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onPageChange(page + 1); }} disabled={page >= totalPages || loading} className="p-2 border border-[var(--color-border)] rounded disabled:opacity-40 hover:bg-[var(--color-bg-elevated)] inline-flex items-center justify-center" aria-label="Next page">
              <IconChevronRight />
            </button>
            <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onPageChange(totalPages); }} disabled={page >= totalPages || loading} className="p-2 border border-[var(--color-border)] rounded disabled:opacity-40 hover:bg-[var(--color-bg-elevated)] inline-flex items-center justify-center" aria-label="Last page">
              <IconChevronDoubleRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
