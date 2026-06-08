import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag, Search, Menu, X, MessageSquarePlus, ChevronDown, Heart,
  LogOut, User, Package, LayoutDashboard, Tag, ClipboardList, ShoppingCart, Eye, Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import NotificationBell from './NotificationBell';
import Logo from './Logo';
import { formatPrice } from '../lib/formatPrice';
import { DELIVERY_FREE_THRESHOLD_RWF } from '../lib/config';

function Avatar({ name, isAdmin }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold select-none flex-shrink-0
      ${isAdmin
        ? 'bg-gradient-to-br from-stone-700 to-stone-900 ring-2 ring-accent/40'
        : 'bg-gradient-to-br from-accent to-accent-dark'}`}>
      {initials}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const [menuOpen, setMenuOpen]       = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    toast('You have been signed out.', 'info');
    navigate('/');
  };

  const navLinks = [
    { to: '/products', label: 'All' },
    { to: '/products?category=women', label: 'Women' },
    { to: '/products?category=men', label: 'Men' },
    { to: '/products?category=kids', label: 'Kids' },
  ];

  const adminMenuItems = [
    { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/products',   icon: Package,         label: 'Products' },
    { to: '/admin/orders',     icon: ShoppingCart,    label: 'Orders' },
    { to: '/admin/requests',   icon: ClipboardList,   label: 'Product Requests' },
    { to: '/admin/discounts',  icon: Tag,             label: 'Discount Codes' },
    { to: '/admin/settings',   icon: Truck,           label: 'Delivery Zones' },
  ];

  const customerMenuItems = [
    { to: '/profile',     icon: User,           label: 'My Profile' },
    { to: '/orders',      icon: Package,        label: 'My Orders' },
    { to: '/wishlist',    icon: Heart,          label: 'Wishlist' },
    { to: '/my-requests', icon: ClipboardList,  label: 'My Requests' },
    { to: '/request',     icon: MessageSquarePlus, label: 'Request a Product' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300
      ${scrolled
        ? 'glass shadow-navbar-scroll'
        : 'bg-white/95 backdrop-blur-sm border-b border-stone-100/80'}`}>

      {/* ── Promo bar ── */}
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white text-center py-2.5 px-4 text-[11px] tracking-[0.18em] font-medium overflow-hidden relative">
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(202,138,4,0.3) 0%, transparent 70%)' }} />
        <div className="relative inline-flex items-center gap-2.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          FREE DELIVERY IN KIGALI ON ORDERS OVER {formatPrice(DELIVERY_FREE_THRESHOLD_RWF)}
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Logo to="/" className="text-xl" />

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors tracking-wide relative group py-1">
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-accent rounded-full group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
            {!isAdmin && (
              <Link to="/request"
                className="text-sm font-semibold text-accent hover:text-accent-dark transition-colors flex items-center gap-1.5 py-1 group">
                <MessageSquarePlus size={14} className="group-hover:scale-110 transition-transform" />
                Request
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin"
                className="text-sm font-semibold text-stone-700 hover:text-stone-900 transition-colors flex items-center gap-1.5 border border-stone-200 px-3 py-1.5 rounded-xl hover:bg-stone-50 hover:border-stone-300 hover:shadow-sm">
                <LayoutDashboard size={13} /> Dashboard
              </Link>
            )}
          </div>

          {/* ── Right Icons ── */}
          <div className="flex items-center gap-0.5">
            {/* Search */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); setUserMenuOpen(false); }}
              className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100/80 rounded-xl transition-all cursor-pointer"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Notification bell — any signed-in user */}
            {user && <NotificationBell />}

            {/* Wishlist */}
            {user && !isAdmin && (
              <Link to="/wishlist"
                className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100/80 rounded-xl transition-all"
                aria-label="Wishlist">
                <Heart size={18} />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart"
              className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100/80 rounded-xl transition-all relative"
              aria-label="Shopping bag">
              <ShoppingBag size={18} />
              {itemCount > 0 && !isAdmin && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none shadow-glow-sm animate-scale-in">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setSearchOpen(false); }}
                className="flex items-center gap-1.5 p-1 hover:bg-stone-100/80 rounded-xl transition-all cursor-pointer"
                aria-label="Account menu"
              >
                {user ? (
                  <>
                    <Avatar name={user.name} isAdmin={isAdmin} />
                    <ChevronDown size={12} className={`text-stone-400 transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </>
                ) : (
                  <div className="p-1.5 text-stone-500 hover:text-stone-900">
                    <User size={18} />
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-64 glass-card rounded-2xl z-50 animate-scale-in overflow-hidden border border-white/80">
                  {user ? (
                    <>
                      {/* User header */}
                      <div className={`px-4 py-4 border-b border-stone-100/80 flex items-center gap-3
                        ${isAdmin
                          ? 'bg-gradient-to-r from-stone-900 to-stone-800'
                          : 'bg-gradient-to-r from-stone-50 to-cream'}`}>
                        <Avatar name={user.name} isAdmin={isAdmin} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${isAdmin ? 'text-white' : 'text-stone-900'}`}>
                              {user.name}
                            </p>
                            {isAdmin && (
                              <span className="text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate ${isAdmin ? 'text-stone-400' : 'text-stone-500'}`}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="py-1.5">
                        {isAdmin ? (
                          <>
                            <p className="px-4 py-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">Platform</p>
                            {adminMenuItems.map(item => (
                              <Link key={item.to} to={item.to}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors rounded-xl mx-1.5"
                                onClick={() => setUserMenuOpen(false)}>
                                <item.icon size={14} className="text-stone-400" />
                                {item.label}
                              </Link>
                            ))}
                            <div className="border-t border-stone-100 mt-1.5 pt-1.5 mx-1.5">
                              <Link to="/products"
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors rounded-xl"
                                onClick={() => setUserMenuOpen(false)}>
                                <Eye size={14} /> View Store
                              </Link>
                            </div>
                          </>
                        ) : (
                          customerMenuItems.map(item => (
                            <Link key={item.to} to={item.to}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors rounded-xl mx-1.5"
                              onClick={() => setUserMenuOpen(false)}>
                              <item.icon size={14} className="text-stone-400" />
                              {item.label}
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="border-t border-stone-100 py-1.5 mx-1.5 mb-1.5">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-semibold rounded-xl cursor-pointer">
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 px-1.5">
                      <div className="px-3 py-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">Account</div>
                      <Link to="/login"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-stone-900 hover:bg-stone-50 transition-colors rounded-xl"
                        onClick={() => setUserMenuOpen(false)}>
                        <User size={14} className="text-stone-400" /> Sign In
                      </Link>
                      <Link to="/register"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-colors rounded-xl"
                        onClick={() => setUserMenuOpen(false)}>
                        <User size={14} className="text-stone-400" /> Create Account
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100/80 rounded-xl transition-all ml-0.5 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* ── Search Dropdown ── */}
        {searchOpen && (
          <div className="pb-4 pt-1 animate-slide-down">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Beyond Beauty..."
                className="input-field"
                autoFocus
              />
              <button type="submit" className="btn-primary px-5 py-3">
                <Search size={15} />
              </button>
              <button type="button" onClick={() => setSearchOpen(false)} className="btn-secondary px-4 py-3">
                <X size={15} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-100/80 bg-white/95 backdrop-blur-sm animate-slide-down">
          <div className="px-4 py-3 space-y-0.5">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="block px-3 py-3 text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors">
                {link.label}
              </Link>
            ))}
            {!isAdmin && (
              <Link to="/request"
                className="flex items-center gap-2 px-3 py-3 text-sm font-semibold text-accent hover:bg-accent/5 rounded-xl transition-colors">
                <MessageSquarePlus size={14} /> Request a Product
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin"
                className="flex items-center gap-2 px-3 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 rounded-xl transition-colors">
                <LayoutDashboard size={14} /> Admin Dashboard
              </Link>
            )}
          </div>
          <div className="border-t border-stone-100 px-4 py-3">
            {user ? (
              <button onClick={handleLogout}
                className="w-full text-left px-3 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
                <LogOut size={14} /> Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-secondary flex-1 py-2.5 text-center text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary flex-1 py-2.5 text-center text-sm">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
