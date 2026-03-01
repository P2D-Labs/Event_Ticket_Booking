import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import DataTable, { Column } from '../../components/ui/DataTable';
import StatusBadge, { statusToVariant } from '../../components/ui/StatusBadge';
import { IconSearch, IconView, IconAdd } from '../../components/icons/PanelIcons';
import FeatureEventModal from '../../components/event/FeatureEventModal';

type Event = {
  id: string;
  title: string;
  slug: string;
  status: string;
  eventDate: string;
  location: string;
  coverImage?: string;
  bookingOpensAt?: string | null;
  category?: { name: string };
  ticketTypes: { quantity: number; soldCount: number }[];
  isFeatured?: boolean;
};

const MY_EVENTS_PAGE_SIZE = 15;

export default function DashboardMyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('eventDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [featureEvent, setFeatureEvent] = useState<Event | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(MY_EVENTS_PAGE_SIZE) });
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/api/events/organizer/mine?${params}`)
      .then((r) => {
        setEvents(r.data.events || []);
        setTotal(r.data.total ?? 0);
      })
      .catch(() => { setEvents([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, statusFilter, refresh]);

  const filtered = events
    .filter((e) => {
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || e.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'eventDate') cmp = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'location') cmp = (a.location || '').localeCompare(b.location || '');
      else cmp = 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else setSortKey(key);
  };

  const columns: Column<Event>[] = [
    { key: 'cover', label: '', render: (row) => row.coverImage ? <div className="w-14 h-10 rounded overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)] shrink-0"><img src={row.coverImage} alt="" className="w-full h-full object-cover" /></div> : '–' },
    { key: 'title', label: 'Event', sortKey: 'title', render: (row) => <Link to={`/dashboard/events/${row.id}`} className="text-[var(--color-primary)] hover:underline font-medium">{row.title}</Link> },
    { key: 'location', label: 'Location', sortKey: 'location' },
    { key: 'category', label: 'Category', render: (row) => row.category?.name ?? '–' },
    { key: 'eventDate', label: 'Date', sortKey: 'eventDate', render: (row) => new Date(row.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'status', label: 'Status', sortKey: 'status', render: (row) => {
      const isComingSoon = row.bookingOpensAt && new Date(row.bookingOpensAt) > new Date();
      return (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={statusToVariant(row.status)}>{row.status}</StatusBadge>
          {row.isFeatured && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">Featured</span>}
          {isComingSoon && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">Coming soon</span>}
        </div>
      );
    } },
    { key: 'sold', label: 'Sold', render: (row) => { const total = row.ticketTypes.reduce((s, t) => s + t.quantity, 0); const sold = row.ticketTypes.reduce((s, t) => s + t.soldCount, 0); return `${sold} / ${total}`; } },
    { key: 'actions', label: '', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/dashboard/events/${row.id}`} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded text-sm border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]" aria-label="View event"><IconView /><span className="hidden md:inline">View</span></Link>
        {row.status === 'PENDING' && (
          <Link to={`/dashboard/events/${row.id}/edit`} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded text-sm border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
            Edit
          </Link>
        )}
        {row.status === 'APPROVED' && (
          row.isFeatured
            ? <span className="inline-flex items-center gap-2 px-3 py-2 rounded text-sm bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">Featured</span>
            : <button type="button" onClick={() => setFeatureEvent(row)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded text-sm bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30">
                Feature
              </button>
        )}
      </div>
    ) },
  ];

  return (
    <>
      <Helmet><title>My Events | NUIT</title></Helmet>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm"
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          </div>
          <Link to="/dashboard/events/new" className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-primary-light)]">
            <IconAdd /> Create event
          </Link>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No events yet."
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          total={total}
          limit={MY_EVENTS_PAGE_SIZE}
          onPageChange={setPage}
        />
        {featureEvent && (
          <FeatureEventModal
            eventId={featureEvent.id}
            eventTitle={featureEvent.title}
            onClose={() => setFeatureEvent(null)}
            onSuccess={() => setRefresh((r) => r + 1)}
          />
        )}
      </div>
    </>
  );
}
