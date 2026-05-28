import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/formatPrice';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Wishlist() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart }         = useCart();
  const { toggle }            = useWishlist();
  const { toast }             = useToast();

  const fetchWishlist = () => {
    api.get('/wishlist')
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (productId) => {
    await toggle(productId);
    setItems(prev => prev.filter(i => i.product_id !== productId));
    toast('Removed from wishlist', 'info', 2000);
  };

  const handleAddToCart = async (item) => {
    if (!item.sizes?.length || !item.colors?.length) {
      toast('View the product to select size & colour', 'warning');
      return;
    }
    await addToCart(
      { id: item.product_id, name: item.name, price: item.price, images: item.images },
      item.sizes[0],
      item.colors[0]
    );
    toast(`${item.name} added to bag!`, 'success');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-heading font-semibold text-stone-900">My Wishlist</h1>
          <p className="text-sm text-stone-400 mt-1 font-medium">
            {items.length} saved item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {items.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center py-16">
            <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Heart size={36} className="text-stone-300" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-stone-700 mb-2">Your wishlist is empty</h2>
            <p className="text-stone-400 text-sm mb-8 max-w-xs">Save items you love by tapping the heart icon on any product.</p>
            <Link to="/products" className="btn-primary px-8 py-4 group">
              Browse Products <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((item, i) => (
              <div key={item.id}
                className="group animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}>

                {/* Image */}
                <Link to={`/products/${item.product_id}`}
                  className="block relative overflow-hidden aspect-[3/4] bg-stone-100 rounded-2xl shadow-card group-hover:shadow-card-hover transition-all duration-500">
                  <img
                    src={item.images?.[0] || ''}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-700"
                  />
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center rounded-2xl">
                      <span className="text-xs font-bold text-white glass px-4 py-2 rounded-full tracking-wider uppercase">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {/* Dark gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl" />
                </Link>

                {/* Info + Actions */}
                <div className="mt-3.5 px-0.5">
                  <p className="text-[10px] text-stone-400 uppercase tracking-[0.18em] font-semibold">{item.category}</p>
                  <Link to={`/products/${item.product_id}`}
                    className="text-sm font-heading font-semibold text-stone-800 hover:text-accent line-clamp-1 transition-colors mt-0.5 block">
                    {item.name}
                  </Link>
                  <p className="text-sm font-heading font-bold text-stone-900 mt-1.5">{formatPrice(item.price)}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock === 0}
                      className="flex-1 btn-primary py-2.5 text-xs gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ShoppingBag size={12} /> Add to Bag
                    </button>
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="p-2.5 border border-red-200 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
