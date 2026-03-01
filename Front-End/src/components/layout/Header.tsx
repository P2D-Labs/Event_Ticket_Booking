import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_CONTENT_CLASS } from '../../lib/layout';

const navLinkClass = 'text-xs md:text-sm tracking-[0.2em] uppercase text-[var(--color-text)]/80 hover:text-[var(--color-primary)] transition';

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('theme') as 'dark' | 'light' | null;
      if (t) return t;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'SUPER_ADMIN';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className={`w-full ${SITE_CONTENT_CLASS} py-5 flex items-center justify-between`}>
      <div className="flex items-center gap-8 md:gap-12">
        <Link to="/" className="font-header text-2xl md:text-3xl tracking-widest text-[var(--color-primary)] no-underline shrink-0">
          NUIT
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={navLinkClass}>Home</Link>
          <Link to="/events" className={navLinkClass}>Events</Link>
          <Link to="/contact" className={navLinkClass}>Contact</Link>
          <Link to="/gallery" className={navLinkClass}>Gallery</Link>
        </div>
      </div>

      {/* Right: theme toggle; from tablet up also avatar or Login/Sign up (on mobile these are in burger menu) */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {/* Tablet and up: avatar or Login/Sign up outside; mobile: only in burger menu */}
        <div className="hidden md:flex items-center gap-2 md:gap-3">
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 text-[var(--color-text)] hover:text-[var(--color-primary)] transition"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-bg)] font-header text-sm shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <span className="text-sm hidden lg:block max-w-[120px] truncate">{user.name}</span>
              <span className="text-[var(--color-text-muted)] text-xs">▼</span>
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-52 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-lg z-20"
                  >
                    <Link to="/account/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]">
                      My Profile
                    </Link>
                    <Link to="/account/bookings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]">
                      My Bookings
                    </Link>
                    {isOrganizer && (
                      <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]">
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]">
                        Admin panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-red-400"
                    >
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <Link to="/auth/login" className={`${navLinkClass} px-3 py-2`}>
              Login
            </Link>
            <Link to="/auth/register" className="bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-2.5 text-xs font-medium tracking-[0.2em] uppercase hover:bg-[var(--color-primary-light)] transition">
              Sign up
            </Link>
          </>
        )}
        </div>
        <button type="button" className="md:hidden p-2 text-[var(--color-text)]" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          ☰
        </button>
      </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 md:hidden bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] p-6 flex flex-col gap-4"
          >
            <Link to="/" onClick={() => setMenuOpen(false)} className={navLinkClass}>Home</Link>
            <Link to="/events" onClick={() => setMenuOpen(false)} className={navLinkClass}>Events</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className={navLinkClass}>Contact</Link>
            <Link to="/gallery" onClick={() => setMenuOpen(false)} className={navLinkClass}>Gallery</Link>
            {user ? (
              <>
                <Link to="/account/profile" onClick={() => setMenuOpen(false)} className={navLinkClass}>My Profile</Link>
                <Link to="/account/bookings" onClick={() => setMenuOpen(false)} className={navLinkClass}>My Bookings</Link>
                {isOrganizer && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className={navLinkClass}>Dashboard</Link>}
                {user.role === 'SUPER_ADMIN' && <Link to="/admin" onClick={() => setMenuOpen(false)} className={navLinkClass}>Admin</Link>}
                <button type="button" onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left text-sm text-[var(--color-text-muted)] hover:text-red-400 py-2 border-t border-[var(--color-border)] mt-2 pt-4">Logout</button>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-2 border-t border-[var(--color-border)] mt-2">
                <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="block w-full text-center py-3 px-4 border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium tracking-widest uppercase rounded hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition" role="link" aria-label="Log in to your account">Login</Link>
                <Link to="/auth/register" onClick={() => setMenuOpen(false)} className="block w-full text-center py-3 px-4 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-medium tracking-widest uppercase rounded hover:bg-[var(--color-primary-light)] transition" role="link" aria-label="Create an account">Sign up</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
