import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ArrowRight, Instagram, Facebook, Twitter } from 'lucide-react';

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
            <Link to="/" className="inline-flex items-baseline gap-0.5 mb-5">
              <span className="text-xl font-heading font-bold tracking-[0.18em] text-white uppercase">M·</span>
              <span className="text-xl font-heading font-bold tracking-[0.18em] text-gradient uppercase">SHOP</span>
            </Link>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">
              Kigali's premier online fashion destination. Quality clothing for every style, every occasion.
            </p>

            {/* Contact */}
            <div className="space-y-2.5 text-xs text-stone-600">
              <div className="flex items-center gap-2.5 hover:text-stone-400 transition-colors cursor-default">
                <MapPin size={13} className="text-accent flex-shrink-0" />
                KG 11 Ave, Kigali, Rwanda
              </div>
              <div className="flex items-center gap-2.5 hover:text-stone-400 transition-colors cursor-default">
                <Phone size={13} className="text-accent flex-shrink-0" />
                +250 788 000 000
              </div>
              <div className="flex items-center gap-2.5 hover:text-stone-400 transition-colors cursor-default">
                <Mail size={13} className="text-accent flex-shrink-0" />
                hello@mshop.rw
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 mt-6">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Facebook,  label: 'Facebook' },
                { icon: Twitter,   label: 'X / Twitter' },
              ].map(({ icon: Icon, label }) => (
                <button key={label}
                  className="w-9 h-9 bg-stone-800 hover:bg-accent rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer group"
                  aria-label={label}
                  title={label}
                >
                  <Icon size={15} className="text-stone-400 group-hover:text-white transition-colors" />
                </button>
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
                'Orders over RWF 50,000',
                'Easy 7-day returns',
                'Secure card payments',
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
          <p>© {new Date().getFullYear()} M·Shop Rwanda. All rights reserved.</p>
          <p>Prices displayed in Rwandan Franc (RWF)</p>
        </div>
      </div>
    </footer>
  );
}
