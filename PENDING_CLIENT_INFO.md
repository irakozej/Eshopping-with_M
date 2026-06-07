# Pending Client Info — Beyond Beauty Boutique

This file tracks outstanding information and assets still required from the client
(**Beyond Beauty Ltd**, RDB 122456686) to complete store configuration.

Keep this file updated as items get resolved in later phases.

**Status legend:** `OPEN` = still needed · `RESOLVED` = received & applied · `BLOCKED` = waiting on a dependency

Last updated: 2026-06-07 (Phase 3 admin seeded)

---

## Outstanding Items

| # | Item | Details / What we have | Status |
|---|------|------------------------|--------|
| 1 | Domain availability | Confirm `beyondbeauty.rw` is available and registered | OPEN |
| 2 | Logo file | High-resolution logo asset (vector/PNG with transparency preferred). Temporary gold wordmark in place at `client/src/components/Logo.jsx` — real logo is a one-file swap | OPEN |
| 3 | MoMo API credentials | Full **API User** + **API Key** needed. Merchant code `030002` set in `.env.example` (`MOMO_MERCHANT_CODE`); `MOMO_API_USER` / `MOMO_API_KEY` left blank "to follow" | OPEN |
| 4 | Stripe account | Future payment provider — account + API keys (not needed at launch) | OPEN |
| 5 | Bank payout details | Bank name, account name, account number for payouts | OPEN |
| 6 | Delivery zones & fees | Exact Kigali delivery zones and their fees (RWF) | OPEN |
| 7 | Return policy text | Final return/refund policy copy | OPEN |
| 8 | Privacy policy text | Final privacy policy copy | OPEN |
| 9 | Terms & conditions text | Final terms and conditions copy | OPEN |
| 10 | Checkout payment methods | Which payment methods to offer at checkout. At launch: **MTN MoMo only** (card hidden via `PAYMENTS_STRIPE_ENABLED=false`). Confirm if cash-on-delivery or others are wanted | OPEN |
| 11 | Gmail App Password | `SMTP_PASS` for `beautybeyond706@gmail.com` (16-char Google App Password) needed to send real emails | OPEN |

---

## Notes

- Do **not** invent any value marked "to follow" / OPEN. Use a clear placeholder in code and reference this file.
- MoMo: merchant/short code `030002` is confirmed; the API User and API Key are still outstanding (item 3).
- Stripe (item 4) is explicitly future scope — capture details when available but not required for launch.

### Phase 1 — Branding applied (2026-06-07)
- Site name, meta title/description, footer, auth pages, and checkout now use "Beyond Beauty Boutique" with tagline "Fashion | Beauty | Lifestyle".
- Gold (#CA8A04) placeholder wordmark added as standalone `Logo.jsx` (one-file swap for the real logo).
- Footer contact = Kicukiro, Kigali; phone/WhatsApp +250794803462; email beautybeyond706@gmail.com; Instagram + TikTok links. Facebook/Twitter removed (no empty social icons).
- WhatsApp floating button points to +250794803462.
- New `/about` page added with PLACEHOLDER copy (marked in-file) — pending real text under item 7–9 / client About copy.

### Phase 2 — Environment configuration (2026-06-07)
- `server/.env.example` and `client/.env.example` documented with APP_NAME, SUPPORT_EMAIL, WHATSAPP_NUMBER, delivery + payment-flag + SMTP + MoMo vars.
- Frontend now reads APP_NAME, WHATSAPP_NUMBER, DELIVERY_FREE_THRESHOLD_RWF from env via `client/src/lib/config.js` (VITE_ prefixed, with real defaults) — used by Navbar, Footer, WhatsApp button, and Checkout.
- Card payments gated by `PAYMENTS_STRIPE_ENABLED` (default false): Checkout hides the card option (MoMo only); Stripe backend route kept intact but returns 503 when disabled.
- Still "to follow": MoMo `API_USER`/`API_KEY` (item 3), Gmail `SMTP_PASS` (item 11). No real .env committed (only .env.example).

### Phase 3 — Launch admin seeded (2026-06-07)
- Added idempotent `server/scripts/seed-admin.js` (`npm run seed:admin`). Creates the only launch admin: **Night Esther Kaliza** &lt;kalizane44@gmail.com&gt;, role admin.
- Temporary password is randomly generated and printed to the console once; only its bcrypt hash is stored. No password committed. Re-running never duplicates or overwrites.
- Verified: user logs in (role `admin`) and reaches admin-only routes.
- `server/db/shop.db-shm` / `-wal` removed from git tracking and gitignored so DB state (incl. password hashes) is never committed.
- **Action for client:** Ms. Esther should log in with the printed temporary password and change it on first login.
