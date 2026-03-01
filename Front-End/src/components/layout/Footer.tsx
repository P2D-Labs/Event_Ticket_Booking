import { Link } from 'react-router-dom';
import { SITE_CONTENT_CLASS } from '../../lib/layout';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-auto">
      <div className={`${SITE_CONTENT_CLASS} py-14 grid grid-cols-1 md:grid-cols-4 gap-12`}>
        <div className="md:col-span-2">
          <Link to="/" className="font-header text-2xl tracking-widest text-[var(--color-primary)] block mb-5">
            NUIT
          </Link>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xs">
            The most exclusive event experiences. Curated events, world-class artists, unforgettable nights.
          </p>
        </div>
        <div>
          <h4 className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-primary)] mb-5">Explore</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/events" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Events</Link></li>
            <li><Link to="/gallery" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Gallery</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-primary)] mb-5">Support</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/contact" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Contact</Link></li>
            <li><Link to="/help" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Help</Link></li>
            <li><Link to="/policies" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Policies</Link></li>
          </ul>
        </div>
      </div>
      <div className={`border-t border-[var(--color-border)] py-6 ${SITE_CONTENT_CLASS} flex flex-col md:flex-row justify-between items-center gap-4`}>
        <span className="text-xs text-[var(--color-text-muted)]">© {new Date().getFullYear()} NUIT. All rights reserved.</span>
        <div className="flex gap-6 text-xs tracking-widest uppercase text-[var(--color-text-muted)]">
          <a href="#" className="hover:text-[var(--color-primary)]">IG</a>
          <a href="#" className="hover:text-[var(--color-primary)]">TW</a>
          <a href="#" className="hover:text-[var(--color-primary)]">FB</a>
        </div>
      </div>
    </footer>
  );
}
