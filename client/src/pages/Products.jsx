import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['women', 'men', 'kids'];
const SIZES_BY_CATEGORY = {
  women: ['XS', 'S', 'M', 'L', 'XL', '24', '25', '26', '27', '28', '29', '30'],
  men:   ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'],
  kids:  ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12'],
};
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '24', '26', '28', '30', '32', '34', '36'];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const size     = searchParams.get('size')     || '';
  const color    = searchParams.get('color')    || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const search   = searchParams.get('search')   || '';
  const featured = searchParams.get('featured') || '';
  const sort     = searchParams.get('sort')     || '';
  const page     = Number(searchParams.get('page') || 1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (size)     params.set('size', size);
      if (color)    params.set('color', color);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (search)   params.set('search', search);
      if (featured) params.set('featured', featured);
      if (sort)     params.set('sort', sort);
      params.set('page', page);
      params.set('limit', 12);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, size, color, minPrice, maxPrice, search, featured, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    setSearchParams(params);
  };

  const activeFilterCount = [category, size, color, minPrice, maxPrice].filter(Boolean).length;
  const sizesToShow = category ? (SIZES_BY_CATEGORY[category] || ALL_SIZES) : ALL_SIZES;

  const pageTitle = search   ? `"${search}"`
    : category               ? category.charAt(0).toUpperCase() + category.slice(1) + "'s"
    : featured               ? 'Featured'
    : 'All Products';

  return (
    <div className="min-h-screen bg-cream">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {search && <p className="section-label mb-1.5">Search results for</p>}
              <h1 className="text-2xl md:text-3xl font-heading font-semibold text-stone-900">{pageTitle}</h1>
              {!loading && (
                <p className="text-sm text-stone-400 mt-1 font-medium">{total} product{total !== 1 ? 's' : ''}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => updateFilter('sort', e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 text-sm font-semibold border border-stone-200 bg-white text-stone-700 rounded-xl
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all cursor-pointer"
                >
                  <option value="">Newest</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="featured">Featured First</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer
                  ${filtersOpen || activeFilterCount > 0
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 hover:bg-stone-50'
                  }`}
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-accent text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters Panel */}
        {filtersOpen && (
          <div className="card p-6 mb-8 animate-slide-down">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Category */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-3">Category</label>
                <div className="space-y-0.5">
                  <button onClick={() => updateFilter('category', '')}
                    className={`block text-sm w-full text-left px-3 py-2 rounded-xl transition-colors font-semibold cursor-pointer
                      ${!category ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}`}>
                    All
                  </button>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => updateFilter('category', c)}
                      className={`block text-sm w-full text-left px-3 py-2 rounded-xl transition-colors font-semibold capitalize cursor-pointer
                        ${category === c ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-3">Size</label>
                <div className="flex flex-wrap gap-1.5">
                  {sizesToShow.slice(0, 12).map(s => (
                    <button key={s} onClick={() => updateFilter('size', size === s ? '' : s)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer
                        ${size === s
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-3">Price Range (RWF)</label>
                <div className="flex gap-2 items-center">
                  <input type="number" placeholder="Min" value={minPrice}
                    onChange={e => updateFilter('minPrice', e.target.value)}
                    className="input-field py-2 w-24 text-xs" />
                  <span className="text-stone-400 font-medium">–</span>
                  <input type="number" placeholder="Max" value={maxPrice}
                    onChange={e => updateFilter('maxPrice', e.target.value)}
                    className="input-field py-2 w-24 text-xs" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-end gap-2">
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-500 transition-colors font-semibold cursor-pointer">
                    <X size={13} /> Clear all filters
                  </button>
                )}
                <button onClick={() => setFiltersOpen(false)}
                  className="text-sm text-stone-400 hover:text-stone-700 transition-colors font-medium cursor-pointer">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {category && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-stone-900 text-white px-3 py-1.5 rounded-full font-semibold">
                {category}
                <button onClick={() => updateFilter('category', '')} className="hover:text-stone-300 transition-colors cursor-pointer"><X size={11} /></button>
              </span>
            )}
            {size && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-stone-900 text-white px-3 py-1.5 rounded-full font-semibold">
                Size: {size}
                <button onClick={() => updateFilter('size', '')} className="hover:text-stone-300 transition-colors cursor-pointer"><X size={11} /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-stone-900 text-white px-3 py-1.5 rounded-full font-semibold">
                RWF {minPrice || '0'} – {maxPrice || '∞'}
                <button onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }} className="hover:text-stone-300 transition-colors cursor-pointer"><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search size={28} className="text-stone-400" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-stone-700 mb-2">No products found</h3>
            <p className="text-stone-400 text-sm mb-6">Try adjusting your filters or search a different term.</p>
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p, i) => (
                <div key={p.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(i % 12) * 40}ms`, animationFillMode: 'backwards' }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-14">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => updateFilter('page', p)}
                    className={`w-10 h-10 text-sm font-semibold rounded-xl border transition-all cursor-pointer
                      ${page === p
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-900 hover:bg-stone-50'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
