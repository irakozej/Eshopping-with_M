import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import { formatPrice } from '../lib/formatPrice';
import { APP_NAME, WHATSAPP_NUMBER, WHATSAPP_NUMBER_E164, DELIVERY_FREE_THRESHOLD_RWF } from '../lib/config';

// Brand contacts — Beyond Beauty Boutique (see PENDING_CLIENT_INFO.md for outstanding items)
const PHONE_DISPLAY = WHATSAPP_NUMBER;
const EMAIL = 'beautybeyond706@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/beyond_beauty_ltd';
const TIKTOK_URL = 'https://vm.tiktok.com/ZS92QkuE4JNYs-16kZp/';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER_E164}`;

// Inline brand icons (lucide-react has no TikTok / WhatsApp glyph)
function TikTokIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3a5.6 5.6 0 0 0 4.5 4.9v3.1a8.6 8.6 0 0 1-4.5-1.3v5.9A6.6 6.6 0 1 1 10.4 9v3.2a3.4 3.4 0 1 0 2.9 3.4V3h3.2Z" />
    </svg>
  );
}

function InstagramIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.3A10 10 0 1 0 12 2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400">

      {/* ── Newsletter Band ── */}
      <div className="border-b border-stone-800/80 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg-dark opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-accent font-bold mb-1.5">Stay in the loop</p>
              <h3 className="text-xl font-heading font-semibold text-white">Get new arrivals & exclusive offers</h3>
            </div>
            <form onSubmit={e => e.preventDefault()} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-72 bg-stone-900/80 border border-stone-700/80 text-white placeholder:text-stone-600 px-4 py-3 text-sm rounded-2xl
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
              />
              <button type="submit"
                className="bg-accent hover:bg-accent-dark text-white px-5 py-3 text-sm font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-glow-sm">
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo to="/" onDark className="text-xl mb-3" />
            <p className="text-[11px] tracking-[0.25em] uppercase text-accent font-bold mb-4">Fashion | Beauty | Lifestyle</p>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">
              {APP_NAME} — a fashion boutique in Kicukiro, Kigali. Curated clothing for every style and every occasion.
            </p>

            {/* Contact */}
            <div className="space-y-2.5 text-xs text-stone-600">
              <div className="flex items-center gap-2.5 cursor-default">
                <MapPin size={13} className="text-accent flex-shrink-0" />
                Kicukiro, Kigali, Rwanda
              </div>
              <a href={`tel:${WHATSAPP_NUMBER_E164}`}
                className="flex items-center gap-2.5 hover:text-stone-400 transition-colors">
                <Phone size={13} className="text-accent flex-shrink-0" />
                {PHONE_DISPLAY}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-stone-400 transition-colors">
                <WhatsAppIcon size={13} className="text-accent flex-shrink-0" />
                WhatsApp us
              </a>
              <a href={`mailto:${EMAIL}`}
                className="flex items-center gap-2.5 hover:text-stone-400 transition-colors break-all">
                <Mail size={13} className="text-accent flex-shrink-0" />
                {EMAIL}
              </a>
            </div>

            {/* Social icons — only channels the client actually has */}
            <div className="flex items-center gap-2.5 mt-6">
              {[
                { icon: InstagramIcon, label: 'Instagram', href: INSTAGRAM_URL },
                { icon: TikTokIcon,  label: 'TikTok',    href: TIKTOK_URL },
                { icon: WhatsAppIcon, label: 'WhatsApp', href: WHATSAPP_URL },
              ].map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-stone-800 hover:bg-accent rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer group"
                  aria-label={label}
                  title={label}
                >
                  <Icon size={15} className="text-stone-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-5">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products?category=women" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Women</Link></li>
              <li><Link to="/products?category=men"   className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Men</Link></li>
              <li><Link to="/products?category=kids"  className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Kids</Link></li>
              <li><Link to="/products?featured=true"  className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">New Arrivals</Link></li>
              <li>
                <Link to="/request"
                  className="hover:text-accent hover:translate-x-1 inline-block transition-all duration-200 font-medium text-stone-500">
                  Request a Product
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-5">Account</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login"    className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Register</Link></li>
              <li><Link to="/orders"   className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Wishlist</Link></li>
              <li><Link to="/profile"  className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Profile</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-5">Info</h4>
            <ul className="space-y-3 text-sm">
              {[
                'Free delivery in Kigali',
                `Orders over ${formatPrice(DELIVERY_FREE_THRESHOLD_RWF)}`,
                'Easy 7-day returns',
                'MTN Mobile Money',
              ].map(info => <li key={info} className="text-stone-500 leading-snug">{info}</li>)}
            </ul>

            {/* Payment badges */}
            <div className="mt-6 flex items-center gap-2 flex-wrap">
              {[
                { label: 'Visa',       cls: 'bg-stone-800 border-stone-700 text-stone-400' },
                { label: 'Mastercard', cls: 'bg-stone-800 border-stone-700 text-stone-400' },
                { label: 'MTN MoMo',   cls: 'bg-yellow-900/50 border-yellow-800/50 text-yellow-500' },
              ].map(b => (
                <div key={b.label}
                  className={`${b.cls} border px-2.5 py-1.5 rounded-xl text-[9px] font-bold tracking-wider uppercase`}>
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-stone-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-stone-700">
          <p>© {new Date().getFullYear()} Beyond Beauty Ltd (RDB 122456686). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-stone-400 transition-colors">About Us</Link>
            <p>Prices displayed in Rwandan Franc (RWF)</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
