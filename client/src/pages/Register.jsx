import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, ArrowRight, Truck, RotateCcw, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'][passwordStrength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/88 via-stone-900/75 to-stone-800/60" />
        <div className="absolute inset-0 mesh-bg-dark opacity-60" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-accent/14 rounded-full blur-[90px]" />
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[70px]" />

        {/* Content */}
        <div className="relative z-10 px-14 max-w-lg animate-fade-in">
          <div className="flex items-baseline gap-0.5 mb-10">
            <span className="text-3xl font-heading font-bold tracking-[0.18em] text-white uppercase">M·</span>
            <span className="text-3xl font-heading font-bold tracking-[0.18em] text-gradient uppercase">SHOP</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-heading font-light text-white leading-[1.1] mb-5">
            Join the<br />
            <span className="font-bold text-gradient">M·Shop</span> family
          </h2>
          <p className="text-stone-300 text-base leading-relaxed mb-10 max-w-sm">
            Create an account to save your wishlist, track orders, and get exclusive offers on the latest fashion from Rwanda and beyond.
          </p>

          {/* Perks */}
          <div className="space-y-3">
            {[
              { icon: Truck,     title: 'Free Kigali Delivery',  desc: 'On orders over RWF 50,000' },
              { icon: RotateCcw, title: '7-Day Easy Returns',    desc: 'No questions asked' },
              { icon: Tag,       title: 'Exclusive Member Deals', desc: 'Early access to sales' },
            ].map(perk => (
              <div key={perk.title} className="flex items-center gap-3.5 glass-hero rounded-2xl px-4 py-3">
                <div className="w-8 h-8 bg-accent/25 rounded-xl flex items-center justify-center flex-shrink-0">
                  <perk.icon size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{perk.title}</p>
                  <p className="text-[11px] text-stone-400">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 mesh-bg">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Form card */}
          <div className="glass-card rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow">
                <UserPlus size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-heading font-semibold text-stone-900">Create account</h1>
              <p className="text-stone-500 text-sm mt-1.5">Join M·Shop today — it's free</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl animate-scale-in">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                  required
                  autoFocus
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  required
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
                    placeholder="Min. 6 characters"
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
                {/* Password strength */}
                {password.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map(level => (
                        <div
                          key={level}
                          className={`flex-1 h-1.5 rounded-full transition-all duration-300
                            ${passwordStrength >= level ? strengthColor : 'bg-stone-200'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold min-w-[36px]
                      ${passwordStrength === 1 ? 'text-red-500'
                        : passwordStrength === 2 ? 'text-yellow-600'
                        : 'text-green-600'}`}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-2 group"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>Create Account <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-stone-500">
              Already have an account?{' '}
              <Link to={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
                className="text-accent font-bold hover:text-accent-dark transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-stone-400 px-2">
            By creating an account you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
