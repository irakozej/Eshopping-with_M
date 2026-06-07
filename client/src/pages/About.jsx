import { Link } from 'react-router-dom';
import { MapPin, Sparkles, ArrowRight } from 'lucide-react';

/*
 * ─────────────────────────────────────────────────────────────────────────
 * PLACEHOLDER COPY — replace when the client provides real "About" text.
 * All prose below is provisional, written from the brief (a fashion boutique
 * in Kicukiro, Kigali, led by Ms. Esther). See PENDING_CLIENT_INFO.md.
 * Do not treat any sentence here as approved marketing copy.
 * ─────────────────────────────────────────────────────────────────────────
 */
export default function About() {
  return (
    <div className="bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div className="absolute inset-0 mesh-bg-dark opacity-50" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-accent/14 rounded-full blur-[90px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center">
          <p className="text-[11px] tracking-[0.3em] uppercase text-accent font-bold mb-4">
            Fashion | Beauty | Lifestyle
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-light leading-[1.1] mb-6">
            About <span className="font-bold text-gradient">Beyond Beauty Boutique</span>
          </h1>
          <p className="text-stone-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {/* PLACEHOLDER */}
            Beyond Beauty Boutique is a fashion boutique based in Kicukiro, Kigali,
            bringing carefully curated clothing to style-conscious shoppers across Rwanda.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6 text-stone-700 leading-relaxed">
        {/* PLACEHOLDER */}
        <h2 className="text-2xl font-heading font-semibold text-stone-900">Our story</h2>
        <p>
          Founded and led by <strong>Ms. Esther, Managing Director</strong>, Beyond Beauty
          Boutique began with a simple idea: fashion in Kigali should feel personal, accessible,
          and effortlessly stylish. Every piece in our collection is chosen with care, with an
          eye for quality and the confidence it gives the people who wear it.
        </p>
        <p>
          From everyday essentials to statement looks, we focus on clothing that fits real life
          in Rwanda — comfortable, versatile, and made to be loved. We are proud to serve our
          community and to keep growing alongside the customers who shop with us.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 pt-4">
          <div className="glass-card rounded-2xl p-6">
            <Sparkles size={18} className="text-accent mb-3" />
            <h3 className="font-heading font-semibold text-stone-900 mb-1.5">Curated fashion</h3>
            <p className="text-sm text-stone-600">
              {/* PLACEHOLDER */}
              A thoughtfully selected clothing collection for every style and occasion.
            </p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <MapPin size={18} className="text-accent mb-3" />
            <h3 className="font-heading font-semibold text-stone-900 mb-1.5">Based in Kigali</h3>
            <p className="text-sm text-stone-600">
              {/* PLACEHOLDER */}
              Proudly located in Kicukiro, Kigali, Rwanda — serving customers nationwide.
            </p>
          </div>
        </div>

        <div className="pt-6">
          <Link to="/products" className="btn-primary px-7 py-3 inline-flex items-center gap-2">
            Shop the collection <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
