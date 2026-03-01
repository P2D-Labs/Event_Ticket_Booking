import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import StatusBadge, { statusToVariant } from '../../components/ui/StatusBadge';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';
import { IconCheck, IconClose, IconSearch, IconAdd, IconView, IconEdit, IconDelete, IconChevronLeft, IconChevronRight } from '../../components/icons/PanelIcons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

type Event = {
  id: string;
  title: string;
  slug: string;
  status: string;
  eventDate: string;
  location: string;
  coverImage?: string;
  bookingOpensAt?: string | null;
  organizer?: { name: string; email: string };
  category?: { name: string };
  isFeatured?: boolean;
};

const ADMIN_EVENTS_PAGE_SIZE = 15;

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'eventDate' | 'title' | 'status'>('eventDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    params.set('page', String(page));
    params.set('limit', String(ADMIN_EVENTS_PAGE_SIZE));
    api.get(`/api/events/admin/events?${params}`).then((r) => {
      setEvents(r.data.events || []);
      setTotal(r.data.total ?? 0);
    }).catch(() => { setEvents([]); setTotal(0); }).finally(() => setLoading(false));
  }, [filter, page]);

  const totalPages = Math.ceil(total / ADMIN_EVENTS_PAGE_SIZE) || 1;
  const filtered = events
    .filter((e) => {
      const term = search.toLowerCase();
      return !term || e.title.toLowerCase().includes(term) || (e.organizer?.name ?? '').toLowerCase().includes(term) || (e.organizer?.email ?? '').toLowerCase().includes(term) || (e.location ?? '').toLowerCase().includes(term);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'eventDate') cmp = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else cmp = a.status.localeCompare(b.status);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED', rejectedReason?: string) => {
    setLoading(true);
    try {
      await api.post(`/api/events/admin/events/${id}/approve`, { status, rejectedReason });
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await api.delete(`/api/events/admin/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setDeleteConfirm(null);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <Helmet><title>Admin – Events | NUIT</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="font-header text-3xl text-[var(--color-text)]">Event approvals</h1>
          <Link to="/admin/events/new" className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-primary-light)]">
            <IconAdd /> Create event
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><IconSearch /></span>
            <input
              type="text"
              placeholder="Search by title, organizer, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] pl-10 pr-4 py-2 rounded text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }}
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm"
          >
            <option value="">All status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={`${sortKey}-${sortOrder}`}
            onChange={(e) => { const [k, o] = (e.target.value as string).split('-'); setSortKey(k as typeof sortKey); setSortOrder(o as 'asc' | 'desc'); }}
            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm"
          >
            <option value="eventDate-desc">Date (newest)</option>
            <option value="eventDate-asc">Date (oldest)</option>
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
            <option value="status-asc">Status A–Z</option>
            <option value="status-desc">Status Z–A</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading events…" />
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No events match.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((e) => {
              const isComingSoon = e.bookingOpensAt && new Date(e.bookingOpensAt) > new Date();
              return (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/events/${e.id}`)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); navigate(`/admin/events/${e.id}`); } }}
                className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-elevated)]/80 transition"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {e.coverImage && (
                    <div className="shrink-0 w-20 h-14 rounded overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
                      <img src={e.coverImage} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text)]">
                      <span className="text-[var(--color-primary)]">{e.title}</span>
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {e.organizer?.name} · {e.location} · {new Date(e.eventDate).toLocaleDateString('en-GB')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge variant={statusToVariant(e.status)}>{e.status}</StatusBadge>
                      {e.isFeatured && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">Featured</span>}
                      {isComingSoon && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">Coming soon</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                  <Link to={`/admin/events/${e.id}`} className="inline-flex items-center justify-center min-h-[36px] gap-2 px-3 py-2 rounded text-sm border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"><IconView /> View</Link>
                  <Link to={`/admin/events/${e.id}/edit`} className="inline-flex items-center justify-center min-h-[36px] gap-2 px-3 py-2 rounded text-sm border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"><IconEdit /> Edit</Link>
                  <ActionButton icon={<IconDelete />} label="Delete" onClick={() => setDeleteConfirm({ id: e.id })} variant="danger" />
                  {e.status === 'PENDING' && (
                    <>
                      <ActionButton icon={<IconCheck />} label="Approve" onClick={() => updateStatus(e.id, 'APPROVED')} variant="primary" />
                      <ActionButton icon={<IconClose />} label="Reject" onClick={() => updateStatus(e.id, 'REJECTED')} variant="danger" />
                    </>
                  )}
                </div>
              </div>
              );
            })}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPage((p) => Math.max(1, p - 1)); }} disabled={page <= 1 || loading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded inline-flex items-center justify-center" aria-label="Previous page">
                  <IconChevronLeft />
                </button>
                <span className="text-sm text-[var(--color-text-muted)] px-4">Page {page} of {totalPages} ({total} total)</span>
                <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPage((p) => Math.min(totalPages, p + 1)); }} disabled={page >= totalPages || loading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 rounded inline-flex items-center justify-center" aria-label="Next page">
                  <IconChevronRight />
                </button>
              </div>
            )}
          </div>
        )}
        <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm.id); }} title="Delete event" message="Soft-delete this event? It will be hidden from public and lists." confirmLabel="Delete" variant="danger" />
      </div>
    </>
  );
}
