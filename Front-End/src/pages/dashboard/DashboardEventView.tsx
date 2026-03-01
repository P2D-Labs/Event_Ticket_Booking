import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackLink from '../../components/ui/BackLink';
import { SITE_MAX_WIDTH, SITE_PADDING_X } from '../../lib/layout';
import StatusBadge, { statusToVariant } from '../../components/ui/StatusBadge';
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

export default function DashboardEventView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const isAdmin = user?.role === 'SUPER_ADMIN';
    const url = isAdmin ? `/api/events/admin/events/${id}` : `/api/events/organizer/${id}`;
    api.get(url).then((r) => setEvent(r.data.event)).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [id, user?.role]);

  if (loading) return <LoadingSpinner fullScreen message="Loading…" />;
  if (!event) return <div className="p-6 text-[var(--color-text-muted)]">Event not found. <BackLink to="/dashboard/my-events">My Events</BackLink></div>;

  const canEdit = user?.role === 'SUPER_ADMIN' || (user?.role === 'ORGANIZER' && event.status === 'PENDING');
  const sold = event.ticketTypes.reduce((s, t) => s + t.soldCount, 0);
  const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);

  return (
    <>
      <Helmet><title>{event.title} | Dashboard | NUIT</title></Helmet>
      <div className={`w-full ${SITE_MAX_WIDTH} ${SITE_PADDING_X} mx-auto max-w-8xl`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <BackLink to="/dashboard/my-events">My Events</BackLink>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge variant={statusToVariant(event.status)}>{event.status}</StatusBadge>
            {event.isFeatured && <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">Featured</span>}
            {event.bookingOpensAt && new Date(event.bookingOpensAt) > new Date() && <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">Coming soon</span>}
            {canEdit && (
              <Link to={`/dashboard/events/${event.id}/edit`} className="inline-flex items-center justify-center min-h-[36px] px-4 py-2 text-sm font-medium rounded bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-light)]">
                Edit event
              </Link>
            )}
          </div>
        </div>

        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-card)]">
          <div className="aspect-video md:aspect-[4/3] overflow-hidden">
            <ClickableImage src={event.coverImage} alt={event.title} className="w-full h-full">
              <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
            </ClickableImage>
          </div>
          <div className="p-6 md:p-8">
            <h1 className="font-header text-3xl md:text-4xl text-[var(--color-text)] mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-[var(--color-text-muted)] mb-6">
              <span>{new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {event.eventTime && <span>{event.eventTime}</span>}
              <span>{event.venue || event.location}</span>
              {event.category && <span className="text-[var(--color-primary)]">{event.category.name}</span>}
            </div>
            {event.status === 'REJECTED' && event.rejectedReason && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                <strong>Rejection reason:</strong> {event.rejectedReason}
              </div>
            )}
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-[var(--color-text-muted)] whitespace-pre-wrap">{event.description}</p>
            </div>
            {event.seatingImage && (
              <div className="mb-8">
                <h3 className="font-header text-xl text-[var(--color-text)] mb-3">Seating</h3>
                <ClickableImage src={event.seatingImage} alt="Seating" className="w-full rounded border border-[var(--color-border)] max-h-80 block">
                  <img src={event.seatingImage} alt="Seating" className="w-full rounded border-0 max-h-80 object-contain" />
                </ClickableImage>
              </div>
            )}
            <h3 className="font-header text-xl text-[var(--color-primary)] mb-4">Tickets</h3>
            <div className="space-y-3 mb-6">
              {event.ticketTypes.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{t.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{t.soldCount} / {t.quantity} sold</p>
                  </div>
                  <p className="font-accent text-lg font-semibold text-[var(--color-primary)]">LKR {Number(t.price).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Total sold: {sold} / {total}</p>
            {event.status === 'APPROVED' && (
              <div className="mt-6 flex gap-3">
                <Link to={`/events/${event.slug}`} className="text-sm text-[var(--color-primary)] hover:underline">View public page →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
