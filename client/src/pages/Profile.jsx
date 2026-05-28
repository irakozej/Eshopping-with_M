import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Check, User as UserIcon, MapPin, Package, Heart, ClipboardList, ArrowRight } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast }               = useToast();

  const [name, setName]       = useState(user?.name || '');
  const [address, setAddress] = useState(
    user?.address
      ? (typeof user.address === 'string' ? JSON.parse(user.address) : user.address)
      : { street: '', city: 'Kigali', state: 'Kigali City', zip: '', country: 'Rwanda' }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, address });
      toast('Profile updated successfully', 'success');
    } catch {
      toast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAddr = (field, value) => setAddress(prev => ({ ...prev, [field]: value }));
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const quickLinks = [
    { to: '/orders',      icon: Package,       label: 'My Orders',        desc: 'Track your orders' },
    { to: '/wishlist',    icon: Heart,         label: 'Wishlist',         desc: 'Saved items' },
    { to: '/my-requests', icon: ClipboardList, label: 'Product Requests', desc: 'Your sourcing requests' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Profile hero */}
      <div className="relative bg-stone-950 overflow-hidden">
        <div className="absolute inset-0 mesh-bg-dark" />
        <div className="absolute right-0 top-0 w-64 h-full bg-accent/08 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xl font-heading font-bold flex-shrink-0 shadow-glow">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-white">{user?.name}</h1>
              <p className="text-stone-400 text-sm mt-0.5">{user?.email}</p>
              <p className="text-stone-500 text-xs mt-1 font-medium tracking-wide uppercase">Customer Account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map(item => (
            <Link key={item.to} to={item.to}
              className="card p-4 flex flex-col items-center text-center gap-2 hover:border-accent/30 hover:shadow-glow-sm transition-all cursor-pointer group">
              <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                <item.icon size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-xs font-heading font-bold text-stone-800">{item.label}</p>
                <p className="text-[10px] text-stone-400 mt-0.5 hidden sm:block">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Account info */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 bg-stone-100 rounded-lg flex items-center justify-center">
                <UserIcon size={13} className="text-stone-500" />
              </div>
              <h2 className="text-sm font-heading font-bold text-stone-800 uppercase tracking-wide">Account Info</h2>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">Email Address</label>
              <input
                value={user?.email || ''}
                className="input-field bg-stone-50 text-stone-400 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-stone-400 mt-1.5 font-medium">Email address cannot be changed</p>
            </div>
          </div>

          {/* Shipping address */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 bg-stone-100 rounded-lg flex items-center justify-center">
                <MapPin size={13} className="text-stone-500" />
              </div>
              <h2 className="text-sm font-heading font-bold text-stone-800 uppercase tracking-wide">Shipping Address</h2>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">Street / Area</label>
              <input
                value={address.street}
                onChange={e => updateAddr('street', e.target.value)}
                className="input-field"
                placeholder="e.g. KG 11 Ave, Nyamirambo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">City</label>
                <input value={address.city} onChange={e => updateAddr('city', e.target.value)} className="input-field" placeholder="Kigali" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">District</label>
                <input value={address.state} onChange={e => updateAddr('state', e.target.value)} className="input-field" placeholder="Kigali City" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">ZIP / Postal</label>
                <input value={address.zip} onChange={e => updateAddr('zip', e.target.value)} className="input-field" placeholder="00000" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">Country</label>
                <select value={address.country} onChange={e => updateAddr('country', e.target.value)} className="input-field cursor-pointer">
                  {['Rwanda', 'Uganda', 'Kenya', 'Tanzania', 'DRC', 'Burundi'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary py-4 px-8 w-full sm:w-auto cursor-pointer">
            {loading ? 'Saving...' : <><Check size={15} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
