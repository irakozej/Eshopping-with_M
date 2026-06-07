# Pending Client Info — Beyond Beauty Boutique

This file tracks outstanding information and assets still required from the client
(**Beyond Beauty Ltd**, RDB 122456686) to complete store configuration.

Keep this file updated as items get resolved in later phases.

**Status legend:** `OPEN` = still needed · `RESOLVED` = received & applied · `BLOCKED` = waiting on a dependency

Last updated: 2026-06-07 (Phase 1 branding applied)

---

## Outstanding Items

| # | Item | Details / What we have | Status |
|---|------|------------------------|--------|
| 1 | Domain availability | Confirm `beyondbeauty.rw` is available and registered | OPEN |
| 2 | Logo file | High-resolution logo asset (vector/PNG with transparency preferred). Temporary gold wordmark in place at `client/src/components/Logo.jsx` — real logo is a one-file swap | OPEN |
| 3 | MoMo API credentials | Full **API User** + **API Key** needed. Only merchant code `030002` known so far | OPEN |
| 4 | Stripe account | Future payment provider — account + API keys (not needed at launch) | OPEN |
| 5 | Bank payout details | Bank name, account name, account number for payouts | OPEN |
| 6 | Delivery zones & fees | Exact Kigali delivery zones and their fees (RWF) | OPEN |
| 7 | Return policy text | Final return/refund policy copy | OPEN |
| 8 | Privacy policy text | Final privacy policy copy | OPEN |
| 9 | Terms & conditions text | Final terms and conditions copy | OPEN |
| 10 | Checkout payment methods | Which payment methods to offer at checkout (MoMo, cash on delivery, etc.) | OPEN |

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
