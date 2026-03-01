import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import DataTable, { Column } from '../../components/ui/DataTable';
import StatusBadge, { statusToVariant } from '../../components/ui/StatusBadge';
import { IconSearch } from '../../components/icons/PanelIcons';

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  total: string | number;
  createdAt: string;
  event: { id: string; title: string; slug: string };
  payment?: { status: string };
};

export default function DashboardBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, order });
    if (statusFilter) params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    api.get(`/api/events/organizer/bookings/list?${params}`)
      .then((r) => {
        setBookings(r.data.bookings || []);
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [page, limit, sort, order, statusFilter, searchQuery]);

  const handleSort = (key: string) => {
    if (sort === key) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else setSort(key);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const columns: Column<Booking>[] = [
    { key: 'bookingNumber', label: 'Booking #', sortKey: 'bookingNumber', render: (row) => <span className="font-mono text-[var(--color-primary)]">{row.bookingNumber}</span> },
    { key: 'event', label: 'Event', render: (row) => row.event ? <Link to={`/events/${row.event.slug}`} className="text-[var(--color-primary)] hover:underline">{row.event.title}</Link> : '–' },
    { key: 'total', label: 'Total (LKR)', sortKey: 'total', render: (row) => Number(row.total).toLocaleString() },
    { key: 'status', label: 'Status', sortKey: 'status', render: (row) => <StatusBadge variant={statusToVariant(row.status)}>{row.status}</StatusBadge> },
    { key: 'createdAt', label: 'Date', sortKey: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
  ];

  return (
    <>
      <Helmet><title>Bookings | NUIT</title></Helmet>
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input
              type="text"
              placeholder="Search by booking # or event..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button type="submit" disabled={loading} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
        <DataTable
          columns={columns}
          data={bookings}
          loading={loading}
          emptyMessage="No bookings yet."
          sortKey={sort}
          sortOrder={order}
          onSort={handleSort}
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>
    </>
  );
}
