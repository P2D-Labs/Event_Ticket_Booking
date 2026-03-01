import { SITE_MAX_WIDTH, SITE_PADDING_X, PAGE_PT, PAGE_PB, PAGE_HEADING_MB, PAGE_INTRO_MB } from '../../lib/layout';

/** Consistent max-width and padding for all pages (same as navbar content width) */
type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** When true, content is centered with max-w-8xl inside the same page width (for forms/single column) */
  narrow?: boolean;
};

export default function PageContainer({ children, className = '', narrow = false }: PageContainerProps) {
  return (
    <div className={[PAGE_PT, PAGE_PB, SITE_PADDING_X, SITE_MAX_WIDTH, 'mx-auto', 'w-full', className].filter(Boolean).join(' ')}>
      {narrow ? <div className="max-w-8xl mx-auto">{children}</div> : children}
    </div>
  );
}

/** Optional: use for consistent page heading block */
export function PageHeading({ label, title, intro }: { label?: string; title: string; intro?: string }) {
  return (
    <header className={PAGE_HEADING_MB}>
      {label && <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--color-primary)] mb-2">{label}</p>}
      <h1 className="font-header text-4xl md:text-5xl text-[var(--color-text)] mb-2">{title}</h1>
      {intro && <p className={`text-[var(--color-text-muted)] ${PAGE_INTRO_MB}`}>{intro}</p>}
    </header>
  );
}
