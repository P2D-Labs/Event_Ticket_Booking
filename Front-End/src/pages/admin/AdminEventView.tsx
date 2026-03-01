import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackLink from '../../components/ui/BackLink';
import StatusBadge, { statusToVariant } from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SortableTh from '../../components/ui/SortableTh';
import ClickableImage from '../../components/ui/ClickableImage';

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  venue?: string | null;
  eventDate: string;
  eventTime?: string | null;
  coverImage: string;
  seatingImage?: string | null;
  status: string;
  rejectedReason?: string | null;
  bookingOpensAt?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  ticketTypes: { id: string; name: string; price: string; quantity: number; soldCount: number }[];
  organizer?: { id: string; name: string; email?: string };
  isFeatured?: boolean;
};

export default function AdminEventView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [bookings, setBookings] = useState<{ bookingNumber: string; customerName: string; email: string; phone: string; status: string; total: number; ticketSummary: string; createdAt: string }[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [bookingsSortKey, setBookingsSortKey] = useState<string | null>('createdAt');
  const [bookingsSortOrder, setBookingsSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!id) return;
    api.get(`/api/events/admin/events/${id}`).then((r) => setEvent(r.data.event)).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !event) return;
    setBookingsLoading(true);
    api.get(`/api/events/admin/events/${id}/bookings`).then((r) => setBookings(r.data.bookings || [])).catch(() => setBookings([])).finally(() => setBookingsLoading(false));
  }, [id, event?.id]);

  const handleExportCsv = async () => {
    if (!id) return;
    setExportingCsv(true);
    try {
      const r = await api.get(`/api/events/admin/events/${id}/bookings/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${(event?.title || id).replace(/[^a-z0-9-_]/gi, '-')}-bookings.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExportingCsv(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/api/events/admin/events/${id}`);
      navigate('/admin/events', { replace: true });
    } catch {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading…" />;
  if (!event) return <div className="p-6 text-[var(--color-text-muted)]">Event not found. <BackLink to="/admin/events">Events</BackLink></div>;

  const sold = event.ticketTypes.reduce((s, t) => s + t.soldCount, 0);
  const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);

  return (
    <>
      <Helmet><title>{event.title} | Admin | NUIT</title></Helmet>
      <div className="max-w-8xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <BackLink to="/admin/events">Events</BackLink>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge variant={statusToVariant(event.status)}>{event.status}</StatusBadge>
            {event.isFeatured && <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">Featured</span>}
            {event.bookingOpensAt && new Date(event.bookingOpensAt) > new Date() && <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">Coming soon</span>}
            <Link to={`/admin/events/${event.id}/edit`} className="inline-flex items-center justify-center min-h-[36px] px-4 py-2 text-sm font-medium rounded bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-light)]">Edit</Link>
            <button type="button" onClick={() => setDeleteConfirm(true)} disabled={deleting} className="inline-flex items-center justify-center min-h-[36px] px-4 py-2 text-sm font-medium rounded border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete'}</button>
          </div>
        </div>
        <ConfirmDialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={handleDelete} title="Delete event" message="Soft-delete this event? It will be hidden from public and lists." confirmLabel="Delete" variant="danger" loading={deleting} />
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-card)]">
          <div className="aspect-video overflow-hidden">
            <ClickableImage src={event.coverImage} alt={event.title} className="w-full h-full">
              <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
            </ClickableImage>
          </div>
          <div className="p-6 md:p-8">
            <h1 className="font-header text-3xl text-[var(--color-text)] mb-4">{event.title}</h1>
            {event.organizer && <p className="text-sm text-[var(--color-text-muted)] mb-2">Organizer: {event.organizer.name} {event.organizer.email && `(${event.organizer.email})`}</p>}
            <div className="flex flex-wrap gap-6 text-sm text-[var(--color-text-muted)] mb-6">
              <span>{new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {event.eventTime && <span>{event.eventTime}</span>}
              <span>{event.venue || event.location}</span>
              {event.category && <span className="text-[var(--color-primary)]">{event.category.name}</span>}
            </div>
            {event.status === 'REJECTED' && event.rejectedReason && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400"><strong>Rejection reason:</strong> {event.rejectedReason}</div>
            )}
            <div className="prose prose-invert max-w-none mb-8"><p className="text-[var(--color-text-muted)] whitespace-pre-wrap">{event.description}</p></div>
            {event.seatingImage && <div className="mb-8"><h3 className="font-header text-xl text-[var(--color-text)] mb-3">Seating</h3><ClickableImage src={event.seatingImage} alt="Seating" className="w-full rounded border border-[var(--color-border)] max-h-80 block"><img src={event.seatingImage} alt="Seating" className="w-full rounded border-0 max-h-80 object-contain" /></ClickableImage></div>}
            <h3 className="font-header text-xl text-[var(--color-primary)] mb-4">Tickets</h3>
            <div className="space-y-3 mb-6">
              {event.ticketTypes.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                  <div><p className="font-medium text-[var(--color-text)]">{t.name}</p><p className="text-xs text-[var(--color-text-muted)]">{t.soldCount} / {t.quantity} sold</p></div>
                  <p className="font-accent text-lg font-semibold text-[var(--color-primary)]">LKR {Number(t.price).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Total sold: {sold} / {total}</p>
            {event.status === 'APPROVED' && <div className="mt-6"><Link to={`/events/${event.slug}`} className="text-sm text-[var(--color-primary)] hover:underline">View public page →</Link></div>}

            <h3 className="font-header text-xl text-[var(--color-text)] mt-10 mb-4">Customers / Bookings</h3>
            <div className="flex items-center gap-4 mb-4">
              <button type="button" onClick={handleExportCsv} disabled={exportingCsv || bookingsLoading} className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium rounded hover:bg-[var(--color-primary-light)] disabled:opacity-50">
                {exportingCsv ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
            {bookingsLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading bookings…</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No bookings yet.</p>
            ) : (
              (() => {
                const handleBookingsSort = (key: string) => {
                  if (bookingsSortKey === key) setBookingsSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                  else { setBookingsSortKey(key); setBookingsSortOrder('asc'); }
                };
                const sortedBookings = [...bookings].sort((a, b) => {
                  let cmp = 0;
                  if (bookingsSortKey === 'bookingNumber') cmp = a.bookingNumber.localeCompare(b.bookingNumber);
                  else if (bookingsSortKey === 'customerName') cmp = (a.customerName || '').localeCompare(b.customerName || '');
                  else if (bookingsSortKey === 'email') cmp = (a.email || '').localeCompare(b.email || '');
                  else if (bookingsSortKey === 'phone') cmp = (a.phone || '').localeCompare(b.phone || '');
                  else if (bookingsSortKey === 'status') cmp = a.status.localeCompare(b.status);
                  else if (bookingsSortKey === 'total') cmp = a.total - b.total;
                  else if (bookingsSortKey === 'ticketSummary') cmp = (a.ticketSummary || '').localeCompare(b.ticketSummary || '');
                  else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  return bookingsSortOrder === 'asc' ? cmp : -cmp;
                });
                return (
              <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                      <SortableTh sortKey={bookingsSortKey} thisKey="bookingNumber" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Booking #</SortableTh>
                      <SortableTh sortKey={bookingsSortKey} thisKey="customerName" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Name</SortableTh>
                      <SortableTh sortKey={bookingsSortKey} thisKey="email" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Email</SortableTh>
                      <SortableTh sortKey={bookingsSortKey} thisKey="phone" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Phone</SortableTh>
                      <SortableTh sortKey={bookingsSortKey} thisKey="status" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Status</SortableTh>
                      <SortableTh sortKey={bookingsSortKey} thisKey="total" sortOrder={bookingsSortOrder} onSort={handleBookingsSort} align="right">Total</SortableTh>
                      <SortableTh sortKey={bookingsSortKey} thisKey="ticketSummary" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Tickets</SortableTh>
                      <SortableTh sortKey={bookingsSortKey} thisKey="createdAt" sortOrder={bookingsSortOrder} onSort={handleBookingsSort}>Date</SortableTh>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBookings.map((b) => (
                      <tr key={b.bookingNumber} className="border-b border-[var(--color-border)]">
                        <td className="p-3 text-[var(--color-primary)]">{b.bookingNumber}</td>
                        <td className="p-3 text-[var(--color-text)]">{b.customerName || '–'}</td>
                        <td className="p-3 text-[var(--color-text-muted)]">{b.email || '–'}</td>
                        <td className="p-3 text-[var(--color-text-muted)]">{b.phone || '–'}</td>
                        <td className="p-3"><StatusBadge variant={statusToVariant(b.status)}>{b.status}</StatusBadge></td>
                        <td className="p-3 text-right text-[var(--color-text)]">LKR {b.total.toLocaleString()}</td>
                        <td className="p-3 text-[var(--color-text-muted)]">{b.ticketSummary || '–'}</td>
                        <td className="p-3 text-[var(--color-text-muted)]">{new Date(b.createdAt).toLocaleString('en-GB')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </>
  );
}
