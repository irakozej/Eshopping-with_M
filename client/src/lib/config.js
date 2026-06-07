/**
 * Store configuration — single source of truth for env-driven values.
 *
 * Vite only exposes variables prefixed with VITE_ to the browser bundle, so the
 * client mirrors a handful of the server's settings under VITE_ names. Each value
 * falls back to the real Beyond Beauty default so the app still works without a
 * local .env (see client/.env.example).
 */
const env = import.meta.env;

export const APP_NAME = env.VITE_APP_NAME || 'Beyond Beauty Boutique';

// WhatsApp: keep the human-readable form for display, and a digits-only (E.164)
// form for wa.me links.
export const WHATSAPP_NUMBER = env.VITE_WHATSAPP_NUMBER || '+250794803462';
export const WHATSAPP_NUMBER_E164 = WHATSAPP_NUMBER.replace(/\D/g, '');

// Free-delivery threshold in RWF.
export const DELIVERY_FREE_THRESHOLD_RWF =
  Number(env.VITE_DELIVERY_FREE_THRESHOLD_RWF) || 50000;

// Default delivery estimate, in days (used for the "Estimated delivery" hint).
export const DELIVERY_DEFAULT_DAYS =
  Number(env.VITE_DELIVERY_DEFAULT_DAYS) || 1;

// Card payments are gated behind a flag (default OFF). When false, the checkout
// UI hides the card option; the Stripe backend route stays intact behind its own
// server-side PAYMENTS_STRIPE_ENABLED flag.
export const PAYMENTS_STRIPE_ENABLED =
  String(env.VITE_PAYMENTS_STRIPE_ENABLED).toLowerCase() === 'true';
