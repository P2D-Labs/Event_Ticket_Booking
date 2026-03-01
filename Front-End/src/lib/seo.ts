/**
 * SEO helpers: absolute URL for og:image and canonical base URL.
 * In browser we use window.location.origin; for SSR or build you can pass VITE_APP_URL.
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') return window.location.origin;
  return import.meta.env.VITE_APP_URL || 'https://eventbooking.lk';
};

export const toAbsoluteUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const base = getBaseUrl();
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
};

export const siteName = 'NUIT';
export const defaultDescription = 'Book tickets for exclusive events in Sri Lanka. Curated experiences, secure payment, and instant confirmation.';
