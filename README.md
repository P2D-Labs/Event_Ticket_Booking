# Event Ticket Booking Platform — Sri Lanka (LKR)

Full-stack event ticket booking system with Stripe, BNPL (Koko, MintPay), premium plans, reward points, and promotions. Built with **Node (Express)**, **Prisma**, **PostgreSQL**, and **React (Vite)** + **Tailwind CSS**.

---

## Project structure

```
Event Ticket Booking/
├── Back-End/          # Express API, Prisma, auth, events, admin
├── Front-End/         # React (Vite) + Tailwind, customer & admin UI
├── event-booking.html # UI reference
└── README.md
```

---

## Backend setup

### 1. Environment

```bash
cd Back-End
cp .env.example .env
```

Edit `.env` and set at least:

- `DATABASE_URL` — PostgreSQL connection string, e.g.  
  `postgresql://USER:PASSWORD@localhost:5432/event_booking?schema=public`
- `JWT_SECRET` — long random string (e.g. 32+ chars)
- `JWT_REFRESH_SECRET` — another long random string
- `FRONTEND_URL` — e.g. `http://localhost:5173`
- Optional: `STRIPE_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for payments and Google login

### 2. Database

```bash
npm install
npx prisma generate
npx prisma migrate dev    # applies migrations (requires running PostgreSQL)
npx prisma db seed        # seeds admin user, sample category, premium plan
```

**Seed users:**  
- **Admin:** `admin@eventbooking.lk` / `Admin@123`  
- **Organizer:** `organizer@eventbooking.lk` / `Organizer@123`  
- **Customer:** `customer@eventbooking.lk` / `Customer@123`  

**Seed coupon:** `EARLY500` — LKR 500 off on orders LKR 3000+ (change in production.)

### 3. Run

```bash
npm run dev   # http://localhost:5000
```

---

## Frontend setup

### 1. Environment

```bash
cd Front-End
cp .env.example .env
```

- `VITE_API_URL` — leave **empty** when using Vite dev proxy (default).  
  For production, set to your API base URL (e.g. `https://api.yourdomain.com`).

### 2. Run

```bash
npm install --legacy-peer-deps
npm run dev   # http://localhost:5173
```

The dev server proxies `/api` and `/uploads` to the backend (see `vite.config.ts`).

---

## Phase 1 — What’s included

### Backend

- **Auth:** Register, login, refresh (JWT + httpOnly cookie), optional Google OAuth
- **Roles:** CUSTOMER, ORGANIZER, SUPER_ADMIN
- **Events:** Create (organizer), list (public with filters), get by slug/id, update
- **Ticket types:** Name, price (LKR), quantity per event
- **Admin:** Approve/reject events, list events by status
- **Categories:** Public list, admin create/update
- **Public API:** Banners, testimonials, categories
- **Upload:** Image upload for organizers (stored under `Back-End/src/uploads/`)
- **Security:** Helmet, CORS, rate limiting, CSRF (cookie + token), validation (Zod)

### Frontend

- **Theme:** Dark/light mode, Bebas Neue + DM Sans + Cormorant Garamond (aligned with `event-booking.html`)
- **Pages:** Home, Events (filters), Event detail, **Checkout** (ticket selection, guest/user, Stripe card), **Booking success**, **My bookings** (account), Login, Register, Google callback
- **Dashboard:** Organizer “My Events” and links (create/edit routes to be added)
- **Admin:** Super Admin panel — event approvals, categories list
- **Layout:** Header (My bookings link when logged in), footer, responsive, theme toggle

### Database (Prisma)

- **Models:** User, RefreshToken, Category, Event, TicketType, EventPaymentMethod, Booking, BookingItem, Payment, Promotion, Coupon, RewardPoint, PremiumPlan, Subscription, Banner, Testimonial, SystemSettings
- **Migration:** `Back-End/prisma/migrations/20250228000000_init/migration.sql`
- **Seed:** Super admin, sample category, sample premium plan, system settings

---

## Phase 2 (done)

- **Booking:** Create booking (guest or user), validate stock, subtotal + handling fee (configurable % or fixed; no fee for premium), total in LKR
- **Stripe:** PaymentIntent (LKR), card payment via Stripe.js/Elements; webhook `POST /api/webhooks/stripe` for `payment_intent.succeeded` (confirm booking, update soldCount, award points)
- **Reward points:** Configurable earn (% or fixed per order); awarded on confirmed booking; stored per user with expiry 1 year
- **API:** `POST /api/checkout/prepare`, `GET /api/checkout/bookings/number/:number`, `GET /api/checkout/bookings/:id`, `GET /api/checkout/my-bookings` (auth)
- **Frontend:** Checkout page (quantities, guest details, Stripe CardElement), success page, My bookings (account)

**Stripe:** Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in backend `.env`. For local webhook testing use Stripe CLI: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`. Set `VITE_STRIPE_PUBLIC_KEY` in frontend `.env`.

---

## Phase 3 (done)

- **Promotions:** Types PERCENTAGE, FIXED_AMOUNT, BUY_ONE_GET_ONE, COUPON, AUTO, FLASH. One promotion per order. Restrictions: payment method, customer type (GUEST/REGISTERED/ALL), date range, min order amount, max discount.
- **Coupons:** Codes linked to a COUPON-type promotion; optional max uses. Validated at checkout; `usedCount` incremented when booking is confirmed.
- **Checkout:** Optional `couponCode` in `POST /api/checkout/prepare`. Auto-apply: if no coupon, best matching AUTO/FLASH promotion is applied. Response includes `discountAmount` and `promotion`.
- **Admin:** `GET/POST/PATCH/DELETE /api/admin/promotions`, `GET/POST/DELETE /api/admin/coupons`. Admin UI: Promotions list + create (name, type, value, dates, restrictions, active), Coupons list + create (code, promotion, max uses).

**DB:** Added `Booking.couponId` (FK to Coupon). Run `npx prisma migrate dev` (or apply `prisma/migrations/20250228100000_add_booking_coupon_id/migration.sql`).

---

## Phase 4 (done)

- **Premium subscription (Stripe):** Recurring subscription via Stripe Checkout. Plans: name, price (LKR), duration (MONTHLY/YEARLY). Stripe Price created on first checkout.
- **API:** `GET /api/subscription/plans`, `POST /api/subscription/checkout-session` (auth), `GET /api/subscription/me`, `POST /api/subscription/cancel`. Webhook syncs Subscription and `user.isPremium`.
- **Frontend:** `/premium` – plans, Subscribe → Stripe; current plan and cancel. Admin: Premium plans CRUD.
- **DB:** `User.stripeCustomerId` (migration `20250228110000_add_user_stripe_customer_id`).

---

## Phase 5 (done)

- **BNPL & payment methods:** Checkout accepts `paymentMethod`: STRIPE | KOKO | MINTPAY | ON_ENTRY. Validated via `getEnabledPaymentMethodsForEvent(eventId)` (global + per-event overrides).
- **STRIPE:** unchanged (clientSecret). **KOKO / MINTPAY:** create booking, stub returns `redirectUrl` (dev stub redirects to backend callback → confirm booking → redirect to success). **ON_ENTRY:** booking created, redirect to success (pay at venue).
- **API:** `GET /api/events/:eventId/payment-methods` (eventId = id or slug). `GET /api/checkout/koko/callback`, `GET /api/checkout/mintpay/callback` (query: bookingId, status=success) confirm booking and redirect to frontend success.
- **Frontend:** Checkout fetches enabled methods, shows payment method selector (Card, Koko, MintPay, Pay at venue); for KOKO/MINTPAY redirects to `redirectUrl`; for ON_ENTRY redirects to success.

---

## Phase 6 (done)

- **SEO:** Reusable `SEO` component (title, description, og:title, og:image, og:url, twitter card). JSON-LD: Event schema on event detail; WebSite + Organization on home. Sitemap: `GET /api/sitemap.xml` (backend, uses FRONTEND_URL + approved event slugs). `public/robots.txt` (Allow /, Disallow /admin, /dashboard, /auth/, /checkout; Sitemap: /api/sitemap.xml).
- **Image optimization:** Lazy loading (`loading="lazy"`, `decoding="async"`) on event list and detail images; hero image remains eager.
- **Security:** Helmet referrerPolicy, xContentTypeOptions, xFrameOptions, HSTS in production; `X-XSS-Protection: 1; mode=block`. No user HTML rendered unsanitized (event description is plain text).

---

## Image sizes (recommended)

| Use        | Size        | Notes        |
|-----------|-------------|--------------|
| Event cover | 1200×630  | 16:9, WebP &lt; 300KB |
| Thumbnail   | 600×600   | WebP        |
| Banner     | 1920×800   | WebP        |
| Seating    | 1600×900   | WebP        |
| Avatar     | 400×400    | WebP        |

---

## Quick test

1. Start PostgreSQL and run backend migrations + seed.
2. `cd Back-End && npm run dev`
3. `cd Front-End && npm run dev`
4. Open http://localhost:5173 — Home, Events, Login/Register.
5. Register as a new user; create an organizer user in DB (set `role = 'ORGANIZER'`) or add a “Become organizer” flow later.
6. After seeding you get: **6 approved events** (Sunset Beach Party, Jazz Night, Comedy Night, Electronic Music Festival, Wine & Dine, Yoga Morning), **2 banners**, **3 testimonials**, **6 categories**, **2 premium plans**, **1 coupon** (`EARLY500`). Log in as admin/organizer/customer (see Seed users above) and try **Events**, **Checkout** (use coupon EARLY500), **Premium**, and **Admin**.
