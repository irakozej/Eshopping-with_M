import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Eye, EyeOff, ArrowRight, Star, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center overflow-hidden">
        {/* Base image */}
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Deep overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/88 via-stone-900/75 to-stone-800/65" />
        {/* Mesh glow */}
        <div className="absolute inset-0 mesh-bg-dark opacity-60" />
        {/* Accent glow orb */}
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-accent/16 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[70px]" />

        {/* Content */}
        <div className="relative z-10 px-14 max-w-lg animate-fade-in">
          {/* Logo */}
          <div className="flex items-baseline gap-0.5 mb-10">
            <span className="text-3xl font-heading font-bold tracking-[0.18em] text-white uppercase">M·</span>
            <span className="text-3xl font-heading font-bold tracking-[0.18em] text-gradient uppercase">SHOP</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-heading font-light text-white leading-[1.1] mb-5">
            Welcome back to<br />
            <span className="font-bold text-gradient">your style</span>
          </h2>
          <p className="text-stone-300 text-base leading-relaxed mb-10 max-w-sm">
            Sign in to access your bag, track orders, and explore the latest curated fashion for Kigali and beyond.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-8 mb-10">
            {[
              { val: '500+', label: 'Products' },
              { val: '4.9', label: 'Rating', icon: Star },
              { val: '24h', label: 'Delivery' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-heading font-bold text-gradient">{stat.val}</p>
                  {stat.icon && <stat.icon size={14} className="fill-accent text-accent" />}
                </div>
                <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {['Women', 'Men', 'Kids', 'New Arrivals'].map(c => (
              <span key={c}
                className="glass-hero text-white/80 text-xs font-semibold px-3.5 py-1.5 rounded-full tracking-wide">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 mesh-bg">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Form card */}
          <div className="glass-card rounded-3xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-deep">
                <LogIn size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-heading font-semibold text-stone-900">Welcome back</h1>
              <p className="text-stone-500 text-sm mt-1.5">Sign in to your M·Shop account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl animate-scale-in">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  required
                  autoFocus
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-11"
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-2 group"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

            <div className="mt-7 text-center space-y-4">
              <p className="text-sm text-stone-500">
                Don't have an account?{' '}
                <Link to={`/register${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
                  className="text-accent font-bold hover:text-accent-dark transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="mt-5 glass rounded-2xl px-5 py-4 text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2.5">Demo Accounts</p>
            <div className="space-y-1.5 text-xs text-stone-500">
              <div className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2">
                <span className="font-mono text-stone-600">admin@eshop.com</span>
                <span className="font-mono text-stone-400">admin123</span>
              </div>
              <div className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2">
                <span className="font-mono text-stone-600">jane@example.com</span>
                <span className="font-mono text-stone-400">customer123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
