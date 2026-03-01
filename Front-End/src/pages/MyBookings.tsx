import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';
import StatusBadge, { statusToVariant } from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { IconChevronLeft, IconChevronRight } from '../components/icons/PanelIcons';
import api from '../api/client';

const MY_BOOKINGS_PAGE_SIZE = 10;

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: { quantity: number; ticketType: { name: string }; unitPrice: string }[];
  event: { title: string; slug: string; eventDate: string; eventTime?: string; location: string };
};

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/checkout/my-bookings?page=${page}&limit=${MY_BOOKINGS_PAGE_SIZE}`)
      .then((r) => {
        setBookings(r.data.bookings || []);
        setTotal(r.data.total ?? 0);
      })
      .catch(() => { setBookings([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / MY_BOOKINGS_PAGE_SIZE) || 1;

  return (
    <>
      <Helmet><title>My bookings | NUIT</title></Helmet>
      <PageContainer>
        <PageHeading title="My bookings" intro="View and manage your ticket bookings." />
        {loading ? (
          <LoadingSpinner message="Loading bookings…" />
        ) : bookings.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No bookings yet. <Link to="/events" className="text-[var(--color-primary)]">Browse events</Link></p>
        ) : (
          <>
            <ul className="space-y-6 max-w-8xl">
              {bookings.map((b) => (
                <li key={b.id} className="border border-[var(--color-border)] p-6 bg-[var(--color-bg-elevated)]">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <Link to={`/events/${b.event.slug}`} className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]">
                      {b.event.title}
                    </Link>
                    <StatusBadge variant={statusToVariant(b.status)}>{b.status}</StatusBadge>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    #{b.bookingNumber} · {new Date(b.event.eventDate).toLocaleDateString('en-GB')}
                    {b.event.eventTime && ` · ${b.event.eventTime}`}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{b.event.location}</p>
                  <p className="mt-3 font-accent text-[var(--color-primary)]">LKR {Number(b.total).toLocaleString()}</p>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 pt-6 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPage((p) => Math.max(1, p - 1)); }} disabled={page <= 1 || loading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 hover:bg-[var(--color-bg-elevated)] rounded inline-flex items-center justify-center" aria-label="Previous page">
                  <IconChevronLeft />
                </button>
                <span className="text-sm text-[var(--color-text-muted)] px-4">Page {page} of {totalPages} ({total} bookings)</span>
                <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPage((p) => Math.min(totalPages, p + 1)); }} disabled={page >= totalPages || loading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 hover:bg-[var(--color-bg-elevated)] rounded inline-flex items-center justify-center" aria-label="Next page">
                  <IconChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
