import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight, Check, Truck, RotateCcw, Shield, Star } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import WishlistButton from '../components/WishlistButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from '../lib/formatPrice';

function StarRating({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type={onChange ? 'button' : undefined}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-stone-200 text-stone-200'
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [adding, setAdding]             = useState(false);
  const [added, setAdded]               = useState(false);
  const [error, setError]               = useState('');

  const [reviews, setReviews]             = useState([]);
  const [reviewStats, setReviewStats]     = useState({ avg: 0, count: 0, dist: {} });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [myReview, setMyReview]           = useState(null);
  const [reviewForm, setReviewForm]       = useState({ rating: 0, comment: '' });
  const [reviewError, setReviewError]     = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data);
        if (res.data.colors?.length === 1) setSelectedColor(res.data.colors[0]);
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const fetchReviews = () => {
    api.get(`/products/${id}/reviews`)
      .then(res => {
        const { reviews: list = [], stats = {} } = res.data;
        setReviews(list);
        setReviewStats({
          avg: stats.average || 0,
          count: stats.total || 0,
          dist: { 5: stats.five || 0, 4: stats.four || 0, 3: stats.three || 0, 2: stats.two || 0, 1: stats.one || 0 },
        });
        if (user) {
          const mine = list.find(r => r.user_id === user.id);
          setMyReview(mine || null);
          if (!mine) setReviewForm({ rating: 0, comment: '' });
        }
      })
      .catch(() => {})
      .finally(() => setReviewLoading(false));
  };

  useEffect(() => { if (id) fetchReviews(); }, [id, user]);

  const handleAddToCart = async () => {
    if (!selectedSize)  { setError('Please select a size');  return; }
    if (!selectedColor) { setError('Please select a colour'); return; }
    setError('');
    setAdding(true);
    try {
      await addToCart(product, selectedSize, selectedColor);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { setReviewError('Please select a rating'); return; }
    setReviewError('');
    setReviewSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      setReviewSuccess(true);
      fetchReviews();
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    try {
      await api.delete(`/products/${id}/reviews`);
      setMyReview(null);
      fetchReviews();
    } catch {}
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80'];
  const avgRounded = Math.round(reviewStats.avg * 10) / 10;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-400 mb-8 font-medium">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="text-stone-300">/</span>
          <Link to="/products" className="hover:text-accent transition-colors">Products</Link>
          <span className="text-stone-300">/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-accent capitalize transition-colors">{product.category}</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600 truncate max-w-[150px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Images ── */}
          <div className="space-y-3 animate-slide-in-left">
            <div className="relative overflow-hidden bg-stone-100 aspect-[3/4] rounded-3xl shadow-card-hover group">
              <img
                src={images[currentImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500"
              />

              {/* Featured badge */}
              {product.featured && (
                <div className="absolute top-4 left-4">
                  <span className="bg-accent text-white text-[10px] px-3 py-1.5 font-bold tracking-widest uppercase rounded-full shadow-glow-sm">
                    Featured
                  </span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 glass hover:bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-card transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={18} className="text-stone-700" />
                  </button>
                  <button
                    onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 glass hover:bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-card transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={18} className="text-stone-700" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={`rounded-full transition-all cursor-pointer ${currentImage === i ? 'bg-white w-5 h-2' : 'bg-white/50 w-2 h-2'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className={`flex-1 aspect-square overflow-hidden rounded-xl border-2 transition-all cursor-pointer
                      ${currentImage === i ? 'border-accent shadow-glow-sm' : 'border-transparent hover:border-stone-300'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="animate-slide-in-right">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.2em] text-accent font-bold">{product.category}</p>
              <WishlistButton
                productId={product.id}
                className="w-9 h-9 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center rounded-xl transition-all cursor-pointer"
              />
            </div>

            <h1 className="text-3xl font-heading font-semibold text-stone-900 mb-3 leading-snug">{product.name}</h1>

            {/* Rating badge */}
            {reviewStats.count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating value={Math.round(avgRounded)} size={14} />
                <span className="text-sm font-bold text-stone-800">{avgRounded}</span>
                <span className="text-xs text-stone-400">({reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''})</span>
              </div>
            )}

            <p className="text-3xl font-heading font-bold text-stone-900 mb-5">{formatPrice(product.price)}</p>

            <p className="text-stone-500 text-sm leading-relaxed mb-8">{product.description}</p>

            {/* Colours */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.16em] text-stone-400 font-bold mb-3">
                  Colour
                  {selectedColor && <span className="text-stone-700 normal-case tracking-normal font-semibold"> — {selectedColor}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)}
                      className={`text-xs px-4 py-2.5 rounded-xl border-2 font-semibold transition-all duration-150 cursor-pointer
                        ${selectedColor === c
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'border-stone-200 text-stone-600 hover:border-stone-500 hover:text-stone-900'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.16em] text-stone-400 font-bold mb-3">
                  Size
                  {selectedSize && <span className="text-stone-700 normal-case tracking-normal font-semibold"> — {selectedSize}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`min-w-[3rem] text-sm px-3 py-2.5 rounded-xl border-2 font-semibold transition-all duration-150 cursor-pointer
                        ${selectedSize === s
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'border-stone-200 text-stone-600 hover:border-stone-500 hover:text-stone-900'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            {/* Add to bag */}
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className={`w-full py-4 text-base flex items-center justify-center gap-2.5 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer
                ${added
                  ? 'bg-green-600 text-white'
                  : product.stock === 0
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'btn-primary'}`}
            >
              {product.stock === 0 ? 'Out of Stock'
                : added ? <><Check size={18} /> Added to Bag</>
                : adding ? 'Adding...'
                : <><ShoppingBag size={18} /> Add to Bag</>
              }
            </button>

            {/* Trust icons */}
            <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-3 gap-3">
              {[
                { icon: Truck,     label: 'Free Delivery', sub: 'Over RWF 50,000' },
                { icon: RotateCcw, label: '7-Day Returns', sub: 'Easy returns' },
                { icon: Shield,    label: 'Secure',        sub: 'Safe checkout' },
              ].map(item => (
                <div key={item.label} className="text-center p-3 bg-stone-50 rounded-2xl">
                  <div className="w-8 h-8 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-2">
                    <item.icon size={14} className="text-accent" />
                  </div>
                  <p className="text-xs font-bold text-stone-700">{item.label}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Stock indicator */}
            <div className="mt-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-400' : 'bg-red-400'}`} />
              <p className="text-xs text-stone-500 font-medium">
                {product.stock > 10 ? 'In stock'
                  : product.stock > 0 ? `Only ${product.stock} left`
                  : 'Out of stock'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="mt-20 border-t border-stone-100 pt-14">
          <h2 className="text-2xl font-heading font-semibold text-stone-900 mb-10">Customer Reviews</h2>

          {/* Stats */}
          {!reviewLoading && reviewStats.count > 0 && (
            <div className="flex flex-col sm:flex-row gap-8 mb-10 p-7 card">
              <div className="text-center sm:border-r border-stone-100 sm:pr-8 flex-shrink-0">
                <p className="text-6xl font-heading font-light text-stone-900">{avgRounded}</p>
                <StarRating value={Math.round(avgRounded)} size={18} />
                <p className="text-xs text-stone-400 mt-2 font-medium">
                  {reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviewStats.dist[star] || 0;
                  const pct = reviewStats.count ? Math.round((count / reviewStats.count) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="w-3 text-right font-medium">{star}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right font-medium">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Write review */}
          {user && !myReview && user.role !== 'admin' && (
            <div className="mb-10 card p-7">
              <h3 className="text-base font-heading font-semibold text-stone-800 mb-5">Write a Review</h3>
              {reviewSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 mb-4 rounded-xl flex items-center gap-2">
                  <Check size={14} /> Review submitted — thank you!
                </div>
              )}
              {reviewError && (
                <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{reviewError}</p>
              )}
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">Your Rating *</label>
                  <StarRating value={reviewForm.rating} onChange={v => setReviewForm(p => ({ ...p, rating: v }))} size={26} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">Your Review</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Share your thoughts about this product..."
                    maxLength={500}
                  />
                  <p className="text-xs text-stone-400 mt-1 text-right">{reviewForm.comment.length}/500</p>
                </div>
                <button type="submit" disabled={reviewSubmitting} className="btn-primary px-7 py-3">
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {!user && (
            <div className="mb-8 bg-accent-light border border-accent/20 px-5 py-4 text-sm rounded-2xl">
              <Link to="/login" className="text-accent font-bold hover:underline">Sign in</Link>
              <span className="text-stone-600"> to leave a review</span>
            </div>
          )}

          {/* Review list */}
          {reviewLoading ? (
            <div className="py-8 text-center text-stone-400 text-sm">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star size={22} className="text-stone-300" />
              </div>
              <p className="text-stone-400 text-sm font-medium">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {reviews.map((review, i) => (
                <div key={review.id}
                  className={`py-6 ${i < reviews.length - 1 ? 'border-b border-stone-100' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {review.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{review.user_name || 'Customer'}</p>
                        <p className="text-[11px] text-stone-400 font-medium">
                          {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <StarRating value={review.rating} size={14} />
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm text-stone-600 leading-relaxed pl-13">{review.comment}</p>
                  )}
                  {user && myReview?.id === review.id && (
                    <button onClick={handleDeleteReview}
                      className="mt-2 text-xs text-stone-400 hover:text-red-500 transition-colors font-medium cursor-pointer">
                      Delete my review
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
