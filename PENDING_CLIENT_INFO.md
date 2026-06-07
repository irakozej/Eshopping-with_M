# Pending Client Info — Beyond Beauty Boutique

This file tracks outstanding information and assets still required from the client
(**Beyond Beauty Ltd**, RDB 122456686) to complete store configuration.

Keep this file updated as items get resolved in later phases.

**Status legend:** `OPEN` = still needed · `RESOLVED` = received & applied · `BLOCKED` = waiting on a dependency

Last updated: 2026-06-07 (Phase 7 final verification)

---

## Outstanding Items

| # | Item | Details / What we have | Status |
|---|------|------------------------|--------|
| 1 | Domain availability | Confirm `beyondbeauty.rw` is available and registered | OPEN |
| 2 | Logo file | High-resolution logo asset (vector/PNG with transparency preferred). Temporary gold wordmark in place at `client/src/components/Logo.jsx` — real logo is a one-file swap | OPEN |
| 3 | MoMo API credentials | Full **API User** + **API Key** needed. Merchant code `030002` set in `.env.example` (`MOMO_MERCHANT_CODE`); `MOMO_API_USER` / `MOMO_API_KEY` left blank "to follow" | OPEN |
| 4 | Stripe account | Future payment provider — account + API keys (not needed at launch) | OPEN |
| 5 | Bank payout details | Bank name, account name, account number for payouts | OPEN |
| 6 | Delivery zones & fees | Exact Kigali delivery zones and their fees (RWF). **Placeholders seeded** (Kicukiro 1500, Nyarugenge 2000, Gasabo 2000) — editable in Admin → Delivery Zones. Need client's real zones/fees | OPEN |
| 7 | Return policy text | Final return/refund policy copy. **DRAFT** at `policies/return-policy.md` (rendered at `/policies/returns`) — needs client review/approval | OPEN |
| 8 | Privacy policy text | Final privacy policy copy. **DRAFT** at `policies/privacy-policy.md` (rendered at `/policies/privacy`) — needs client review/approval | OPEN |
| 9 | Terms & conditions text | Final terms and conditions copy. **DRAFT** at `policies/terms-and-conditions.md` (rendered at `/policies/terms`) — needs client review/approval | OPEN |
| 10 | Checkout payment methods | **Launch decision implemented & verified:** MTN MoMo + Pickup at store; card hidden behind `PAYMENTS_STRIPE_ENABLED=false`. (Optional future: confirm if cash-on-delivery is wanted.) | RESOLVED |
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

### Phase 4 — Kigali delivery zones (2026-06-07)
- New `delivery_zones` DB table; 3 PLACEHOLDER zones seeded idempotently (Kicukiro 1500, Nyarugenge 2000, Gasabo 2000), flagged `is_placeholder`.
- Admin → **Delivery Zones** page (`/admin/settings`): add / edit (name + fee) / activate / delete zones. Editing a placeholder clears its placeholder flag. Hint text marks placeholders and explains the free-delivery rule.
- Checkout reads zones from the DB (`GET /api/delivery/zones`) — no hardcoded fees. Adds a 4th option **"Pickup at store (free)"**.
- Free delivery auto-applied when subtotal ≥ `DELIVERY_FREE_THRESHOLD_RWF` (50000) → fee 0, "Free delivery applied". "Estimated delivery: 24 hours within Kigali" shown near the selector (from `DELIVERY_DEFAULT_DAYS`).
- **Action for client:** replace the 3 placeholder zones with real Kigali zones & fees (item 6).

### Phase 5 — Order emails (PAUSED, partial)
- `utils/email.js` rebranded to Beyond Beauty Boutique and fully env-driven (`SMTP_*`, `APP_NAME`, `SUPPORT_EMAIL`); jsonTransport kept as local-dev-only fallback. SMTP scaffold added to `server/.env` (gitignored).
- **Blocked on:** Gmail App Password (`SMTP_PASS`, item 11) to send the real test email. Resume later.

### Phase 6 — Policy drafts (2026-06-07)
- DRAFT policies authored in `/policies` (`return-policy.md`, `privacy-policy.md`, `terms-and-conditions.md`), plain English for client review.
- Rendered at `/policies/returns`, `/policies/privacy`, `/policies/terms` (dependency-free Markdown renderer); each page shows a "DRAFT — pending client review" banner; footer links added.
- **Action for client:** review and approve/edit the three drafts (items 7–9), then we remove the DRAFT banners.

### Phase 7 — Final verification (2026-06-07)
- **Customer flow ✓:** browse (12 products) → register → add to cart (subtotal RWF 72,000) → **free delivery auto-applied** (shipping_fee 0) → MoMo checkout via the not-configured demo fallback → order created (#7, total 72,000) and shown in order history.
- **Order email — partial:** the confirmation email is generated correctly (subject + Beyond Beauty branding + recipient) but currently routes to the **dev console fallback**, not a real inbox. Real inbox delivery is **still blocked on the Gmail App Password** (item 11) and a server restart to load the SMTP env. Not yet confirmed in a real inbox.
- **Admin (Night Esther Kaliza) ✓:** Dashboard stats, Products (19), Orders (4, incl. #7), and Delivery Zones (3) all load (HTTP 200).
- **Commits:** Phases 0–4 and 6 are each a separate commit; Phase 5 (email) is intentionally left uncommitted until real delivery is confirmed.
