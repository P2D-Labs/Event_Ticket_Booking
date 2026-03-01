import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { toAbsoluteUrl } from '../lib/seo';
import PageContainer from '../components/layout/PageContainer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ClickableImage from '../components/ui/ClickableImage';
import api from '../api/client';

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  venue?: string;
  eventDate: string;
  eventTime?: string;
  coverImage: string;
  seatingImage?: string;
  bookingOpensAt?: string | null;
  category?: { name: string };
  ticketTypes: { id: string; name: string; price: string; quantity: number; soldCount: number }[];
  organizer?: { name: string; organization?: string };
  isFeatured?: boolean;
};

export default function EventDetail() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slugOrId) return;
    api.get(`/api/events/${slugOrId}`).then((r) => setEvent(r.data.event)).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [slugOrId]);

  if (loading) return <PageContainer><LoadingSpinner fullScreen message="Loading…" /></PageContainer>;
  if (!event) return <PageContainer><p className="text-center">Event not found. <Link to="/events" className="text-[var(--color-primary)]">Back to events</Link></p></PageContainer>;

  const available = (t: { quantity: number; soldCount: number }) => t.quantity - t.soldCount;
  const now = new Date();
  const bookingOpen = !event.bookingOpensAt || new Date(event.bookingOpensAt) <= now;

  const eventUrl = typeof window !== 'undefined' ? `${window.location.origin}/events/${event.slug}` : '';
  const startDate = event.eventTime
    ? `${event.eventDate}T${event.eventTime}:00`
    : `${event.eventDate}T00:00:00`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description.slice(0, 200),
    startDate,
    location: {
      '@type': 'Place',
      name: event.venue || event.location,
      address: { '@type': 'PostalAddress', addressLocality: event.location },
    },
    image: toAbsoluteUrl(event.coverImage),
    url: eventUrl,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'LKR',
      lowPrice: Math.min(...event.ticketTypes.map((t) => Number(t.price))).toString(),
      highPrice: Math.max(...event.ticketTypes.map((t) => Number(t.price))).toString(),
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <SEO
        title={event.title}
        description={event.description.slice(0, 160)}
        ogImage={event.coverImage}
        ogUrl={`/events/${event.slug}`}
        ogType="article"
        jsonLd={jsonLd}
      />

      <PageContainer className="pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
              <div className="aspect-video md:aspect-[4/3] overflow-hidden border border-[var(--color-border)]">
                <ClickableImage src={event.coverImage} alt={event.title} className="w-full h-full">
                  <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" loading="eager" decoding="async" />
                </ClickableImage>
              </div>
              <div className="mt-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {event.isFeatured && <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">Featured</span>}
                  {event.bookingOpensAt && new Date(event.bookingOpensAt) > new Date() && <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">Coming soon</span>}
                </div>
                <h1 className="font-header text-4xl md:text-5xl text-[var(--color-text)] mb-4">{event.title}</h1>
                <div className="flex flex-wrap gap-6 text-sm text-[var(--color-text-muted)] mb-6">
                  <span>{new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  {event.eventTime && <span>{event.eventTime}</span>}
                  <span>{event.venue || event.location}</span>
                  {event.category && <span className="text-[var(--color-primary)]">{event.category.name}</span>}
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-[var(--color-text-muted)] whitespace-pre-wrap">{event.description}</p>
                </div>
                {event.seatingImage && (
                  <div className="mt-8">
                    <h3 className="font-header text-xl text-[var(--color-text)] mb-3">Seating</h3>
                    <ClickableImage src={event.seatingImage} alt="Seating" className="w-full rounded border border-[var(--color-border)] block">
                      <img src={event.seatingImage} alt="Seating" className="w-full rounded border-0" loading="lazy" decoding="async" />
                    </ClickableImage>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="sticky top-28 bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6">
                <h3 className="font-header text-xl text-[var(--color-primary)] mb-4">Tickets</h3>
                {event.bookingOpensAt && new Date(event.bookingOpensAt) > now && (
                  <div className="mb-4 p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-primary)]/30 rounded text-sm text-[var(--color-text)]">
                    Ticket booking opens on <strong>{new Date(event.bookingOpensAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</strong>. You can view details but cannot book yet.
                  </div>
                )}
                <div className="space-y-3 mb-6">
                  {event.ticketTypes.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{t.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{available(t)} left</p>
                      </div>
                      <p className="font-accent text-lg font-semibold text-[var(--color-primary)]">
                        LKR {Number(t.price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                {bookingOpen ? (
                <Link
                  to={`/checkout?event=${encodeURIComponent(event.id)}`}
                  className="block w-full bg-[var(--color-primary)] text-[var(--color-bg)] text-center py-4 text-sm font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition"
                >
                  Book tickets
                </Link>
                ) : (
                <div className="block w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] text-center py-4 text-sm font-medium tracking-widest uppercase border border-[var(--color-border)] cursor-not-allowed">
                  Booking not open yet
                </div>
                )}
              </div>
            </div>
          </div>
      </PageContainer>
    </>
  );
}
