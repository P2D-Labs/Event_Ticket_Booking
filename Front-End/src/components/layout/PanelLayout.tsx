import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconLogout } from '../icons/PanelIcons';
import { SITE_CONTENT_CLASS } from '../../lib/layout';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
};
type NavGroup = {
  label?: string;
  items: NavItem[];
};

type PanelLayoutProps = {
  title: string;
  subtitle?: string;
  navGroups: NavGroup[];
  logoHref?: string;
  showThemeToggle?: boolean;
  /** When false, hide logout and copyright in sidebar (e.g. Organizer dashboard uses header logout) */
  showSidebarFooter?: boolean;
  /** When true, wrap entire panel in site max-width so it matches customer pages */
  boxed?: boolean;
  /** When true, sidebar has no background (transparent), for minimal look */
  sidebarTransparent?: boolean;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function PanelLayout({ title, subtitle, navGroups, logoHref = '/', showThemeToggle = true, showSidebarFooter = true, boxed = false, sidebarTransparent = false }: PanelLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const panelContent = (
    <>
      {/* Sidebar: icon-only on mobile, full with labels from md */}
      <aside className={`w-16 md:w-60 shrink-0 border-r border-[var(--color-border)] flex flex-col ${sidebarTransparent ? 'bg-transparent' : 'bg-[var(--color-bg-elevated)]'}`}>
        <div className="p-3 md:p-4 border-b border-[var(--color-border)] flex justify-center md:justify-start">
          <NavLink to={logoHref} className="flex items-center gap-2 no-underline text-[var(--color-text)]" title="NUIT">
            <span className="w-9 h-9 rounded bg-[var(--color-primary)] flex items-center justify-center font-header text-[var(--color-bg)] text-lg shrink-0">N</span>
            <div className="hidden md:block">
              <span className="font-header text-lg tracking-wide text-[var(--color-primary)]">NUIT</span>
              <span className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Event Booking</span>
            </div>
          </NavLink>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-4">
              {group.label && (
                <p className="px-4 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2 hidden md:block">{group.label}</p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? false}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 text-sm transition-colors border-l-2 border-transparent ${
                      isActive
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                    }`
                  }
                >
                  <span className="shrink-0 [&>svg]:block">{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {showSidebarFooter && (
          <div className="p-3 md:p-4 border-t border-[var(--color-border)] space-y-2">
            <button
              type="button"
              onClick={async () => { await logout(); navigate('/'); }}
              title="Logout"
              className="flex items-center justify-center md:justify-start gap-3 w-full px-3 md:px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded border-l-2 border-transparent hover:border-[var(--color-primary)]"
            >
              <IconLogout />
              <span className="hidden md:inline">Logout</span>
            </button>
            <p className="text-[10px] text-[var(--color-text-muted)] hidden md:block">© {new Date().getFullYear()} NUIT. All rights reserved.</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm">
          <div>
            <h1 className="font-header text-xl text-[var(--color-text)]">{title}</h1>
            {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-muted)] hidden sm:block">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
            </span>
            {showThemeToggle && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            )}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto w-full">
          <Outlet />
        </main>
      </div>
    </>
  );

  if (boxed) {
    return (
      <div className={`min-h-screen bg-[var(--color-bg)] ${SITE_CONTENT_CLASS}`}>
        <div className="flex min-h-screen bg-[var(--color-bg)]">
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {panelContent}
    </div>
  );
}
