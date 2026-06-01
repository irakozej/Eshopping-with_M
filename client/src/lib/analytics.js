const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SCRIPT = import.meta.env.VITE_PLAUSIBLE_SCRIPT_SRC || 'https://plausible.io/js/script.js';
const DEBUG = import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

let loaded = false;

export function initPlausible() {
  if (loaded || !PLAUSIBLE_DOMAIN || typeof document === 'undefined') return;
  const s = document.createElement('script');
  s.defer = true;
  s.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
  s.src = PLAUSIBLE_SCRIPT;
  document.head.appendChild(s);
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
  loaded = true;
  if (DEBUG) console.log('[analytics] Plausible loaded for', PLAUSIBLE_DOMAIN);
}

export function trackPageview() {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return;
  window.plausible('pageview');
  if (DEBUG) console.log('[analytics] pageview', window.location.pathname);
}

export function trackEvent(name, props) {
  if (DEBUG) console.log('[analytics]', name, props || {});
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return;
  window.plausible(name, props ? { props } : undefined);
}
