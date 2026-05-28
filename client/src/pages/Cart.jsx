import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Check, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from '../lib/formatPrice';

const SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

export default function Cart() {
  const { items, loading, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const { user } = useAuth();

  const [discountCode, setDiscountCode]       = useState('');
  const [discount, setDiscount]               = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError]     = useState('');

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <ShoppingBag size={36} className="text-stone-300" />
        </div>
        <h1 className="text-2xl font-heading font-semibold text-stone-800 mb-2">Your bag is empty</h1>
        <p className="text-stone-400 mb-8 text-sm max-w-xs">Looks like you haven't added anything yet. Explore our collection!</p>
        <Link to="/products" className="btn-primary px-8 py-4 group">
          Start Shopping <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  const shipping       = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discountAmount = discount?.amount || 0;
  const total          = Math.max(0, subtotal + shipping - discountAmount);
  const remaining      = SHIPPING_THRESHOLD - subtotal;
  const progressPct    = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100);

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const res = await api.post('/discounts/validate', { code: discountCode, subtotal });
      setDiscount(res.data);
    } catch (err) {
      setDiscountError(err.response?.data?.error || 'Invalid discount code');
      setDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  const removeDiscount = () => { setDiscount(null); setDiscountCode(''); setDiscountError(''); };

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-inner">
          <h1 className="text-2xl font-heading font-semibold text-stone-900">Shopping Bag</h1>
          <p className="text-sm text-stone-400 mt-1 font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Free shipping progress */}
        {subtotal < SHIPPING_THRESHOLD && (
          <div className="bg-amber-50 border border-amber-200/70 px-5 py-4 mb-8 rounded-2xl flex items-start gap-3 animate-slide-up">
            <Truck size={18} className="text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-700">
                Add <span className="text-accent font-bold">{formatPrice(remaining)}</span> more for <strong>free Kigali delivery!</strong>
              </p>
              <div className="mt-2.5 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Cart Items ── */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.id} className="card p-4 flex gap-4 group animate-fade-in hover:shadow-card-hover transition-all duration-300">
                <Link to={`/products/${item.product_id}`}
                  className="flex-shrink-0 w-24 h-32 bg-stone-100 overflow-hidden rounded-xl">
                  <img
                    src={item.images?.[0] || ''}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/products/${item.product_id}`}
                        className="font-heading font-semibold text-sm text-stone-900 hover:text-accent transition-colors line-clamp-2">
                        {item.name}
                      </Link>
                      <div className="flex gap-1.5 mt-2">
                        {item.color && (
                          <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-1 rounded-lg uppercase tracking-wide">
                            {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-1 rounded-lg uppercase tracking-wide">
                            Size {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-stone-900 whitespace-nowrap font-heading">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 font-medium">{formatPrice(item.price)} each</p>

                  <div className="flex items-center justify-between mt-4">
                    {/* Qty controls */}
                    <div className="flex items-center gap-0.5 bg-stone-100 rounded-xl p-0.5">
                      <button
                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-white hover:text-stone-900 rounded-lg transition-all cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-3 text-sm font-bold text-stone-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-white hover:text-stone-900 rounded-lg transition-all cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-base font-heading font-bold text-stone-900 mb-5">Order Summary</h2>

              {/* Discount code */}
              <div className="mb-5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-stone-400 mb-2.5">
                  <Tag size={11} /> Discount Code
                </label>
                {discount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-green-800 flex items-center gap-1.5">
                        <Check size={12} /> {discount.code}
                      </p>
                      <p className="text-[10px] text-green-600 mt-0.5">Saving {formatPrice(discountAmount)}</p>
                    </div>
                    <button onClick={removeDiscount}
                      className="text-[10px] font-semibold text-stone-400 hover:text-red-500 transition-colors cursor-pointer">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                      className="input-field flex-1 text-sm py-2.5"
                      placeholder="Enter code"
                    />
                    <button
                      onClick={applyDiscount}
                      disabled={discountLoading || !discountCode.trim()}
                      className="btn-secondary px-4 py-2 text-xs whitespace-nowrap cursor-pointer"
                    >
                      {discountLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {discountError && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{discountError}</p>}
              </div>

              {/* Price breakdown */}
              <div className="space-y-3 text-sm border-t border-stone-100 pt-4 mb-4">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-stone-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Delivery</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : 'text-stone-800'}`}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                {discount && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount</span>
                    <span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 pt-4 mb-6">
                <div className="flex justify-between font-heading font-bold text-stone-900 text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {user ? (
                <Link to="/checkout" className="btn-primary w-full py-4 group">
                  Proceed to Checkout
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="space-y-2.5">
                  <Link to="/checkout" className="btn-secondary w-full py-3.5">Guest Checkout</Link>
                  <Link to="/login?redirect=/checkout" className="btn-primary w-full py-3.5 group">
                    Sign In & Checkout
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}

              <Link to="/products"
                className="block text-center text-xs text-stone-400 hover:text-accent mt-4 transition-colors font-medium">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
