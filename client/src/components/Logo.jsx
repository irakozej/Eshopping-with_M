import { Link } from 'react-router-dom';

/**
 * Logo — Beyond Beauty Boutique wordmark.
 *
 * TEMPORARY PLACEHOLDER WORDMARK. The real logo file has not been provided yet
 * (see PENDING_CLIENT_INFO.md, item 2). This is intentionally a single, standalone
 * component so the real logo is a ONE-FILE SWAP later: when the asset arrives,
 * replace only the inner markup of this component (e.g. with an <img src=... />)
 * and every usage across the app (Navbar, Footer, auth pages) updates at once.
 *
 * Brand gold: #CA8A04
 *
 * Props:
 *   to       — link target (default "/"). Pass null to render as a plain span (no link).
 *   onDark   — set true on dark backgrounds so the second word renders white.
 *   onClick  — optional click handler (e.g. closing a mobile menu).
 *   className — sizing/spacing utilities, e.g. "text-xl" or "text-3xl".
 */
const GOLD = '#CA8A04';

export default function Logo({ to = '/', onDark = false, onClick, className = '' }) {
  const wordmark = (
    <span className="inline-flex items-baseline gap-1.5 font-heading font-bold tracking-[0.16em] uppercase whitespace-nowrap">
      <span style={{ color: GOLD }}>Beyond</span>
      <span className={onDark ? 'text-white' : 'text-stone-950'}>Beauty</span>
    </span>
  );

  if (to === null) {
    return <span className={`inline-flex items-baseline ${className}`}>{wordmark}</span>;
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label="Beyond Beauty Boutique — home"
      className={`inline-flex items-baseline flex-shrink-0 transition-opacity hover:opacity-80 ${className}`}
    >
      {wordmark}
    </Link>
  );
}
