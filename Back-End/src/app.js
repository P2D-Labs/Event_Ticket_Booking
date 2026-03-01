import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import './config/passport.js';
import { csrfProtection, csrfErrorHandler } from './middleware/csrf.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './utils/prisma.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import categoryRoutes from './routes/category.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import bannerRoutes from './routes/banner.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';
import planRoutes from './routes/plan.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import publicRoutes from './routes/public.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import userRoutes from './routes/user.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import contactRoutes from './routes/contact.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust proxy if behind reverse proxy (for rate limit)
app.set('trust proxy', 1);

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // relax for API; tighten per route if needed
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
}));
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests.' },
});
app.use(limiter);

// Stripe webhook must use raw body for signature verification (before express.json)
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// CSRF for state-changing routes (exclude webhooks and auth callback)
app.use((req, res, next) => {
  const skipPaths = ['/api/webhooks', '/api/auth/google/callback', '/api/auth/refresh'];
  if (skipPaths.some((p) => req.path.startsWith(p))) return next();
  return csrfProtection(req, res, next);
});
app.use(csrfErrorHandler);

// Public routes (no auth)
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CSRF token for SPA (must be after csrf middleware)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken?.() || '' });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Sitemap (SEO)
app.get('/api/sitemap.xml', async (req, res) => {
  try {
    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const events = await prisma.event.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      select: { slug: true, updatedAt: true },
    });
    const lastmod = new Date().toISOString().slice(0, 10);
    const urls = [
      { loc: base, changefreq: 'daily', priority: '1.0' },
      { loc: `${base}/events`, changefreq: 'daily', priority: '0.9' },
      { loc: `${base}/premium`, changefreq: 'weekly', priority: '0.7' },
      ...events.map((e) => ({ loc: `${base}/events/${e.slug}`, changefreq: 'weekly', priority: '0.8', lastmod: (e.updatedAt && new Date(e.updatedAt).toISOString().slice(0, 10)) || lastmod })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (e) {
    res.status(500).set('Content-Type', 'application/xml').send('<?xml version="1.0"?><error />');
  }
});

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.use(notFound);
app.use(errorHandler);

export default app;
