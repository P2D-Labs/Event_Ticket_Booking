import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { toAbsoluteUrl } from '../lib/seo';
import { SITE_CONTENT_CLASS } from '../lib/layout';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';

type Banner = { id: string; title?: string; subtitle?: string; imageUrl: string; linkUrl?: string; buttonLabel?: string; sortOrder: number };
type Event = { id: string; title: string; slug: string; coverImage: string; eventDate: string; eventTime?: string; location: string; bookingOpensAt?: string | null; ticketTypes: { price: string }[] };
type Testimonial = { id: string; author: string; content: string; rating?: number };

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80';
const SLIDER_INTERVAL_MS = 6000;

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [comingSoonEvents, setComingSoonEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    api.get('/api/public/banners').then((r) => setBanners(r.data.banners || [])).catch(() => {});
    api.get('/api/events').then((r) => setEvents(r.data.events || [])).catch(() => {});
    api.get('/api/public/featured-events?limit=6').then((r) => setFeaturedEvents(r.data.events || [])).catch(() => {});
    api.get('/api/public/coming-soon-events?limit=6').then((r) => setComingSoonEvents(r.data.events || [])).catch(() => {});
    api.get('/api/public/testimonials').then((r) => setTestimonials(r.data.testimonials || [])).catch(() => {});
  }, []);

  const heroSlides = banners.length > 0 ? banners : [{ id: 'fallback', imageUrl: FALLBACK_IMAGE, title: '', subtitle: '', linkUrl: '', buttonLabel: '', sortOrder: 0 }];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % heroSlides.length), SLIDER_INTERVAL_MS);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  const currentHero = heroSlides[heroIndex];
  const minPrice = (e: Event) => Math.min(...e.ticketTypes.map((t) => Number(t.price)));

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'NUIT', description: 'Exclusive event ticket booking in Sri Lanka.', url: toAbsoluteUrl('/'), potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${toAbsoluteUrl('/events')}?location={search_term_string}` }, 'query-input': 'required name=search_term_string' } },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'NUIT', url: toAbsoluteUrl('/'), logo: toAbsoluteUrl('/vite.svg') },
  ];

  return (
    <>
      <SEO title="NUIT — Exclusive Events | Sri Lanka" description="Book tickets for exclusive events. Curated experiences in Sri Lanka." ogUrl="/" jsonLd={jsonLd} />

      {/* Hero — Banner slider */}
      <section className="relative min-h-[90vh] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentHero.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img src={currentHero.imageUrl} alt="" className="w-full h-full object-cover brightness-[0.3] saturate-75" />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg)]/90 40% to-[var(--color-primary)]/5 pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="relative z-10 flex flex-col justify-end p-8 md:p-12 lg:pl-15 lg:pb-20">
          {currentHero.title && (
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-primary)] flex items-center gap-3 mb-5">
              <span className="w-10 h-px bg-[var(--color-primary)]" />
              {currentHero.title}
            </p>
          )}
          <h1 className="font-header text-6xl md:text-7xl lg:text-8xl leading-tight tracking-wide text-[var(--color-text)] mb-6">
            {currentHero.subtitle ? (
              currentHero.subtitle.split('\n').map((line, i) => <span key={i}>{line}{i === 0 ? <br /> : null}</span>)
            ) : (
              <>Night<br />Club<br /><span className="text-[var(--color-primary)]">Party</span></>
            )}
          </h1>
          <div className="flex gap-4 flex-wrap">
            {currentHero.linkUrl && (
              currentHero.linkUrl.startsWith('http') ? (
                <a href={currentHero.linkUrl} target="_blank" rel="noopener noreferrer" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-10 py-4 text-xs font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition">
                  {currentHero.buttonLabel || 'Learn more'}
                </a>
              ) : (
                <Link to={currentHero.linkUrl} className="bg-[var(--color-primary)] text-[var(--color-bg)] px-10 py-4 text-xs font-medium tracking-widest uppercase hover:bg-[var(--color-primary-light)] transition">
                  {currentHero.buttonLabel || 'Learn more'}
                </Link>
              )
            )}
            <Link to="/events" className="border border-[var(--color-text)]/30 text-[var(--color-text)] px-10 py-4 text-xs tracking-widest uppercase hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition">
              View Events
            </Link>
          </div>
        </div>
        {heroSlides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setHeroIndex(i)}
                className={`h-2 rounded-full transition-all ${i === heroIndex ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-[var(--color-text)]/40 hover:bg-[var(--color-text)]/60'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ticker */}
      <div className="bg-[var(--color-primary)] text-[var(--color-bg)] py-3 overflow-hidden">
        <div className="animate-[ticker_25s_linear_infinite] whitespace-nowrap inline-block">
          {['EXCLUSIVE EVENTS', 'LIVE PERFORMANCES', 'VIP TABLES', 'WORLD CLASS'].flatMap((t) => [t, ' • ']).map((item, i) => (
            <span key={i} className="font-header text-sm tracking-wider px-8">{item}</span>
          ))}
        </div>
      </div>

      {/* Featured — single-row carousel, 45° badge */}
      <section className={`py-16 md:py-20 ${SITE_CONTENT_CLASS}`}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--color-primary)] flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[var(--color-primary)]" />
              Featured
            </p>
            <h2 className="font-header text-4xl md:text-5xl lg:text-6xl tracking-wide text-[var(--color-text)]">Featured Events</h2>
          </div>
          <Link to="/events?featured=1" className="text-[10px] tracking-widest uppercase text-[var(--color-primary)] border-b border-[var(--color-primary)] pb-0.5 w-fit hover:opacity-80 transition">
            View All
          </Link>
        </div>
        {featuredEvents.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No featured events right now. Organizers can feature approved events from the Dashboard.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-px scroll-smooth snap-x snap-mandatory [scrollbar-width:thin]">
            {featuredEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
              >
                <Link to={`/events/${event.slug}`} className="block bg-[var(--color-bg-elevated)] overflow-hidden group rounded-sm border border-[var(--color-border)] h-full">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" loading="lazy" />
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
                    <span className="absolute top-4 right-4 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-semibold px-3 py-1.5 rounded">LKR {minPrice(event).toLocaleString()}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[9px] tracking-wider uppercase text-[var(--color-primary)] mb-1">{event.location}</p>
                    <h3 className="font-header text-xl tracking-wide text-[var(--color-text)] mb-1">{event.title}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{event.eventTime ? ` · ${event.eventTime}` : ''}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming — elevated bg, portrait cards (same as before) */}
      <section className={`py-16 md:py-20 bg-[var(--color-bg-elevated)] border-y border-[var(--color-border)] ${SITE_CONTENT_CLASS}`}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--color-primary)] flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[var(--color-primary)]" />
              On Stage
            </p>
            <h2 className="font-header text-4xl md:text-5xl lg:text-6xl tracking-wide text-[var(--color-text)]">Upcoming Events</h2>
          </div>
          <Link to="/events" className="text-[10px] tracking-widest uppercase text-[var(--color-primary)] border-b border-[var(--color-primary)] pb-0.5 w-fit hover:opacity-80 transition">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 bg-[var(--color-border)]">
          {events.slice(0, 6).map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-[var(--color-bg-elevated)] overflow-hidden group">
              <Link to={`/events/${event.slug}`} className="block">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover grayscale-[40%] brightness-75 group-hover:grayscale-0 group-hover:brightness-50 group-hover:scale-105 transition-all duration-500" loading="lazy" decoding="async" />
                  <span className="absolute top-5 right-5 bg-[var(--color-primary)] text-[var(--color-bg)] font-accent text-sm font-semibold px-3 py-1.5 z-10">LKR {minPrice(event).toLocaleString()}</span>
                </div>
                <div className="p-6 bg-gradient-to-t from-[var(--color-bg)] to-transparent -mt-24 relative pt-20">
                  <p className="text-[9px] tracking-wider uppercase text-[var(--color-primary)] mb-2">{event.location}</p>
                  <h3 className="font-header text-2xl tracking-wide text-[var(--color-text)] mb-2">{event.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{event.eventTime ? ` · ${event.eventTime}` : ''}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Coming Soon — different bg, distinct “Opens DD MMM” badge */}
      <section className={`py-16 md:py-20 ${SITE_CONTENT_CLASS}`}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--color-primary)] flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[var(--color-primary)]" />
              Booking opens soon
            </p>
            <h2 className="font-header text-4xl md:text-5xl lg:text-6xl tracking-wide text-[var(--color-text)]">Coming Soon</h2>
          </div>
          <Link to="/events?comingSoon=1" className="text-[10px] tracking-widest uppercase text-[var(--color-primary)] border-b border-[var(--color-primary)] pb-0.5 w-fit hover:opacity-80 transition">
            View All
          </Link>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-8xl">These events are announced but ticket booking is not open yet.</p>
        {comingSoonEvents.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No coming soon events. Organizers can set a future &quot;Booking opens at&quot; date when creating events.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonEvents.slice(0, 6).map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-[var(--color-bg-elevated)] rounded-xl overflow-hidden group border border-[var(--color-border)] shadow-sm">
                <Link to={`/events/${event.slug}`} className="block">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <span className="text-[10px] font-medium tracking-widest uppercase text-white drop-shadow">Booking opens</span>
                      {event.bookingOpensAt ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400 bg-amber-500/30 text-white px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(event.bookingOpensAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="rounded-full border-2 border-amber-400 bg-amber-500/30 text-white px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm">Soon</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-[9px] tracking-wider uppercase text-[var(--color-primary)] mb-1">{event.location}</p>
                    <h3 className="font-header text-xl tracking-wide text-[var(--color-text)] mb-1">{event.title}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{event.eventTime ? ` · ${event.eventTime}` : ''}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials — distinct full-width quote style */}
      {testimonials.length > 0 && (
        <section className={`py-20 md:py-24 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] ${SITE_CONTENT_CLASS}`}>
          <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--color-primary)] mb-3">Testimonials</p>
          <h2 className="font-header text-3xl md:text-4xl text-[var(--color-text)] mb-12">What People Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map((t) => (
              <blockquote key={t.id} className="relative pl-6 border-l-2 border-[var(--color-primary)]/50 py-2">
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-4">&ldquo;{t.content}&rdquo;</p>
                <footer className="text-[var(--color-primary)] font-accent font-semibold text-sm">{t.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
