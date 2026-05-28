import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquarePlus, Truck, RotateCcw, ShieldCheck, Star, Sparkles, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const MARQUEE_ITEMS = [
  'Free Kigali Delivery', 'New Season Arrivals', 'MTN MoMo Accepted',
  'Women · Men · Kids', '7-Day Returns', 'Curated Fashion',
  'Free Kigali Delivery', 'New Season Arrivals', 'MTN MoMo Accepted',
  'Women · Men · Kids', '7-Day Returns', 'Curated Fashion',
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products?featured=true&limit=8')
      .then(res => setFeatured(res.data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-cream overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-stone-950 min-h-[92vh] flex items-center">
        {/* Mesh glow */}
        <div className="absolute inset-0 mesh-bg-dark" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/07 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-stone-800/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 border border-accent/30 bg-accent/12 px-4 py-2 rounded-full mb-8 animate-fade-in backdrop-blur-sm">
              <Sparkles size={12} className="text-accent animate-pulse-soft" />
              <span className="text-xs tracking-[0.22em] uppercase text-accent font-bold">New Season Arrivals</span>
            </div>
            <h1 className="font-heading font-light text-white leading-[1.05] mb-6 animate-slide-up">
              <span className="block text-5xl md:text-7xl">Style that</span>
              <span className="block text-5xl md:text-7xl font-bold mt-1">speaks for</span>
              <span className="block text-5xl md:text-7xl italic font-light text-gradient mt-1">itself.</span>
            </h1>
            <p className="text-stone-400 text-base md:text-lg mb-10 max-w-md leading-relaxed animate-slide-up animation-delay-100">
              Curated fashion for Kigali and beyond — timeless pieces, delivered to your door.
            </p>
            <div className="flex flex-wrap gap-3 animate-slide-up animation-delay-200">
              <Link to="/products" className="btn-accent px-8 py-4 text-sm group shadow-glow hover:shadow-glow-lg">
                Shop Now <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/products?category=women"
                className="border border-white/20 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/35 px-8 py-4 text-sm font-semibold rounded-2xl transition-all duration-200 inline-flex items-center gap-2">
                Women's Collection
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-5 animate-fade-in animation-delay-400">
              <div className="flex -space-x-2.5">
                {['A','B','C','D','E'].map((l, i) => (
                  <div key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-600 to-stone-700 border-2 border-stone-900 flex items-center justify-center text-[10px] font-bold text-stone-300">
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className="fill-accent text-accent" />)}
                  <span className="text-xs font-bold text-white ml-1.5">4.9</span>
                </div>
                <p className="text-xs text-stone-500">Loved by shoppers across Rwanda</p>
              </div>
            </div>
          </div>

          {/* Hero images */}
          <div className="grid grid-cols-2 gap-3 max-w-lg w-full mx-auto animate-slide-in-right animation-delay-200">
            <div className="row-span-2 overflow-hidden rounded-3xl shadow-deep group">
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85" alt="Fashion"
                className="w-full h-full min-h-[380px] object-cover group-hover:scale-[1.04] transition-transform duration-700" />
            </div>
            <div className="overflow-hidden rounded-3xl shadow-deep group">
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=85" alt="Fashion"
                className="w-full h-48 object-cover group-hover:scale-[1.04] transition-transform duration-700" />
            </div>
            <div className="overflow-hidden rounded-3xl shadow-deep relative group">
              <img src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=500&q=85" alt="Fashion"
                className="w-full h-48 object-cover group-hover:scale-[1.04] transition-transform duration-700" />
              <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-accent" />
                  <span className="text-[10px] font-bold text-stone-800 tracking-wide">TRENDING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-accent overflow-hidden py-3.5 relative">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(161,98,7,0.5) 0%, transparent 20%, transparent 80%, rgba(161,98,7,0.5) 100%)' }} />
        <div className="flex animate-marquee whitespace-nowrap">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 mx-6 text-white text-xs font-bold tracking-[0.2em] uppercase">
              {item}
              <span className="w-1.5 h-1.5 rounded-full bg-white/50 inline-block" />
            </span>
          ))}
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Truck,       title: 'Free Kigali Delivery', desc: 'On orders over RWF 50,000' },
            { icon: RotateCcw,   title: '7-Day Returns',        desc: 'Hassle-free returns policy' },
            { icon: ShieldCheck, title: 'Secure Payments',      desc: 'Card & MTN Mobile Money' },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-4 justify-center sm:justify-start group cursor-default">
              <div className="w-11 h-11 rounded-2xl bg-accent-light flex items-center justify-center flex-shrink-0
                group-hover:bg-accent/20 group-hover:shadow-glow-sm transition-all duration-300">
                <item.icon size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800 font-heading">{item.title}</p>
                <p className="text-xs text-stone-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Collections</p>
          <h2 className="section-heading">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Women', sub: 'Dresses, Shirts & More',     href: '/products?category=women', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=85' },
            { label: 'Men',   sub: 'Shirts, Trousers & Jackets', href: '/products?category=men',   img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&q=85' },
            { label: 'Kids',  sub: 'Cute & Comfortable',         href: '/products?category=kids',  img: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=85' },
          ].map(cat => (
            <Link key={cat.label} to={cat.href}
              className="relative overflow-hidden aspect-[4/5] group block rounded-3xl shadow-card hover:shadow-deep transition-all duration-500 cursor-pointer">
              <img src={cat.img} alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white text-2xl font-heading font-semibold mb-1">{cat.label}</p>
                <p className="text-stone-300 text-xs mb-4">{cat.sub}</p>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full group-hover:bg-accent group-hover:border-accent transition-all duration-300">
                  Shop Now <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="section-label mb-2">Hand-picked</p>
            <h2 className="section-heading">Featured Pieces</h2>
          </div>
          <Link to="/products?featured=true"
            className="text-sm font-semibold text-stone-500 hover:text-accent transition-colors flex items-center gap-1.5 group">
            View all <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map((product, i) => (
              <div key={product.id} className="animate-slide-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── STATS ── */}
      <section className="relative overflow-hidden py-14">
        <div className="absolute inset-0 bg-stone-100/80 border-y border-stone-200" />
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '500+',   label: 'Products' },
              { num: '2,400+', label: 'Happy Customers' },
              { num: '4.9★',   label: 'Average Rating' },
              { num: '24h',    label: 'Kigali Delivery' },
            ].map(stat => (
              <div key={stat.label} className="group">
                <p className="text-3xl font-heading font-bold text-gradient group-hover:scale-110 transition-transform duration-300 inline-block">
                  {stat.num}
                </p>
                <p className="text-sm text-stone-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUEST CTA ── */}
      <section className="relative overflow-hidden bg-stone-950">
        <div className="absolute inset-0 mesh-bg-dark" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/14 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center py-20 px-4">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent/30">
            <MessageSquarePlus size={26} className="text-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-4 leading-tight">
            Can't find what<br /><span className="font-bold">you're looking for?</span>
          </h2>
          <p className="text-stone-400 mb-10 leading-relaxed max-w-lg mx-auto text-base">
            Submit a product request with photos and details. Our team will source it for you within Rwanda and beyond.
          </p>
          <Link to="/request" className="btn-accent px-10 py-4 text-sm group shadow-glow hover:shadow-glow-lg">
            Request a Product <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
