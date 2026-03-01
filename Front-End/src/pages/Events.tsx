import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import PageContainer, { PageHeading } from '../components/layout/PageContainer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { IconChevronLeft, IconChevronRight } from '../components/icons/PanelIcons';
import api from '../api/client';

type Category = { id: string; name: string; slug: string };
type Event = {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  eventDate: string;
  eventTime?: string;
  location: string;
  bookingOpensAt?: string | null;
  category?: { name: string };
  ticketTypes: { price: string }[];
  isFeatured?: boolean;
};

const EVENTS_PAGE_SIZE = 12;

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<{ categoryId?: string; location?: string; fromDate?: string; toDate?: string; minPrice?: string; maxPrice?: string; featured?: string; comingSoon?: string }>(() => ({
    featured: searchParams.get('featured') || '',
    comingSoon: searchParams.get('comingSoon') || '',
  }));

  useEffect(() => {
    api.get('/api/public/categories').then((r) => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.location) params.set('location', filters.location);
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.featured === '1') params.set('featured', '1');
    if (filters.comingSoon === '1') params.set('comingSoon', '1');
    const currentPage = searchParams.get('page') ? Math.max(1, parseInt(searchParams.get('page')!, 10)) : 1;
    setPage(currentPage);
    params.set('page', String(currentPage));
    params.set('limit', String(EVENTS_PAGE_SIZE));
    api.get(`/api/events?${params}`).then((r) => {
      setEvents(r.data.events || []);
      setTotal(r.data.total ?? 0);
    }).catch(() => { setEvents([]); setTotal(0); }).finally(() => setLoading(false));
  }, [filters, searchParams]);

  useEffect(() => {
    const f = searchParams.get('featured');
    const c = searchParams.get('comingSoon');
    if (f || c) setFilters((prev) => ({ ...prev, featured: f || '', comingSoon: c || '' }));
  }, [searchParams]);

  const totalPages = Math.ceil(total / EVENTS_PAGE_SIZE) || 1;
  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const p2 = new URLSearchParams(searchParams);
    if (next === 1) p2.delete('page'); else p2.set('page', String(next));
    setSearchParams(p2);
  };

  const minPrice = (e: Event) => Math.min(...e.ticketTypes.map((t) => Number(t.price)));

  return (
    <>
      <SEO title="Events" description="Browse and book events in Sri Lanka." ogUrl="/events" />

      <PageContainer>
          <PageHeading label="Browse" title="All Events" intro="Find and book tickets for upcoming events." />
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-10 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <select
              value={filters.featured === '1' ? 'featured' : filters.comingSoon === '1' ? 'comingSoon' : ''}
              onChange={(e) => {
                const v = e.target.value;
                setFilters((f) => ({ ...f, featured: v === 'featured' ? '1' : '', comingSoon: v === 'comingSoon' ? '1' : '' }));
                const p = new URLSearchParams(searchParams);
                p.delete('page');
                if (v === 'featured') { p.set('featured', '1'); p.delete('comingSoon'); }
                else if (v === 'comingSoon') { p.set('comingSoon', '1'); p.delete('featured'); }
                else { p.delete('featured'); p.delete('comingSoon'); }
                setSearchParams(p);
              }}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm"
            >
              <option value="">All events</option>
              <option value="featured">Featured only</option>
              <option value="comingSoon">Coming soon only</option>
            </select>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value || undefined }))}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Location"
              value={filters.location || ''}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value || undefined }))}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm w-40"
            />
            <input
              type="date"
              value={filters.fromDate || ''}
              onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value || undefined }))}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm"
            />
            <input
              type="date"
              value={filters.toDate || ''}
              onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value || undefined }))}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Min price (LKR)"
              value={filters.minPrice || ''}
              onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value || undefined }))}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm w-32"
            />
            <input
              type="number"
              placeholder="Max price (LKR)"
              value={filters.maxPrice || ''}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value || undefined }))}
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-sm w-32"
            />
          </div>

          {loading ? (
            <LoadingSpinner fullScreen message="Loading events…" />
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-[var(--color-text-muted)]">No events found.</div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const isComingSoon = event.bookingOpensAt && new Date(event.bookingOpensAt) > new Date();
                const isFeatured = event.isFeatured === true;
                return (
                  <Link key={event.id} to={`/events/${event.slug}`} className="block bg-[var(--color-bg-elevated)] overflow-hidden border border-[var(--color-border)] group">
                    <div className="aspect-[3/4] overflow-hidden relative">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                      {isFeatured && (
                        <span
                          className="absolute top-4 left-4 inline-flex items-center gap-2.5 text-[var(--color-bg)] text-[11px] font-bold tracking-[0.2em] uppercase py-2.5 pl-4 pr-5 font-accent z-10"
                          style={{
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, var(--color-primary) 100%)',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12) inset, 0 2px 4px rgba(0,0,0,0.2)',
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 6% 100%, 0 88%)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                          }}
                        >
                          <span className="w-2 h-2 rounded-full bg-[var(--color-bg)]/90 shrink-0 ring-2 ring-[var(--color-bg)]/40" aria-hidden />
                          <span className="tracking-widest">Featured</span>
                          <span className="w-2 h-2 rounded-full bg-[var(--color-bg)]/90 shrink-0 ring-2 ring-[var(--color-bg)]/40" aria-hidden />
                        </span>
                      )}
                      {isComingSoon ? (
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-10">
                          <span className="text-[10px] font-medium tracking-widest uppercase text-white drop-shadow">Booking opens</span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400 bg-amber-500/30 text-white px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(event.bookingOpensAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      ) : (
                        <span className="absolute top-4 right-4 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-semibold px-3 py-1.5 rounded z-10">
                          LKR {minPrice(event).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-[9px] tracking-wider uppercase text-[var(--color-primary)] mb-1">
                        {event.category?.name || event.location}
                      </p>
                      <h2 className="font-header text-2xl text-[var(--color-text)] mb-2">{event.title}</h2>
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">
                        {new Date(event.eventDate).toLocaleDateString('en-GB')}
                        {event.eventTime && ` · ${event.eventTime}`}
                      </p>
                      <p className="font-accent text-[var(--color-primary)] font-semibold">
                        From LKR {minPrice(event).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 pt-6 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 hover:bg-[var(--color-bg-elevated)] rounded inline-flex items-center justify-center" aria-label="Previous page">
                  <IconChevronLeft />
                </button>
                <span className="text-sm text-[var(--color-text-muted)] px-4">
                  Page {page} of {totalPages} ({total} events)
                </span>
                <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading} className="p-2 border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 hover:bg-[var(--color-bg-elevated)] rounded inline-flex items-center justify-center" aria-label="Next page">
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
