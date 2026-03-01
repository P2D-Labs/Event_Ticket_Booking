# Security & validation

## Input validation (backend)

- **Auth** (`utils/validation/auth.schemas.js`): All auth routes use Zod schemas – email (max 255), password (min/max length), name/phone/org length limits, OTP 6 digits only, token and newPassword length limits for reset.
- **Events** (`utils/validation/event.schemas.js`): Create/update event validated with title, description, location, dates, ticket types, payment methods; URLs and CUIDs where applicable.
- **Checkout** (`utils/validation/checkout.schemas.js`): eventId (CUID), items (ticketTypeId, quantity), guest fields length-limited, payment method enum.
- **Promotions/Coupons**: Schemas with type enums, date formats, value ranges.
- **Contact**: Email format validated; name, email, subject, message trimmed and length-capped (200/255/5000 chars) before sending.

## Sanitization

- **Strings**: `.trim()` and `.slice(0, N)` or `.max(N)` in Zod used on user input before persistence.
- **Email**: Normalized with `.toLowerCase().trim()` on registration, login, OTP, forgot password.
- **CSV export**: `escapeCsvCell()` used for booking export to avoid formula injection.
- **Database**: Prisma parameterized queries throughout (no raw SQL concatenation).

## Security measures

- **CSRF**: Cookie-based CSRF protection on state-changing routes; webhooks and auth callback excluded.
- **Auth**: JWT access + httpOnly refresh cookie; `authenticate` and `requireRoles` middleware on protected routes.
- **Rate limiting**: Applied globally (e.g. 200 req/15 min).
- **Helmet**: Security headers (XSS, content-type, frame options, etc.).
- **CORS**: Restricted to `FRONTEND_URL`.
- **Admin**: User list/detail, reset password, and event management require `SUPER_ADMIN` role.

## Recommendations

- Keep dependencies updated (`npm audit`).
- Use env vars for secrets (JWT, DB, SMTP); never commit `.env`.
- In production, use HTTPS and secure cookies.
