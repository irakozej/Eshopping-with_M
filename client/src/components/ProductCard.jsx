import { Link } from 'react-router-dom';
import { ShoppingBag, Plus } from 'lucide-react';
import { formatPrice } from '../lib/formatPrice';
import WishlistButton from './WishlistButton';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80';
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    const size  = product.sizes?.[0]  || '';
    const color = product.colors?.[0] || '';
    try {
      await addToCart(product, size, color);
      toast(`${product.name} added to cart`, 'success');
    } catch {
      toast('Could not add to cart', 'error');
    }
  };

  return (
    <div className="group relative animate-fade-in cursor-pointer">
      <Link to={`/products/${product.id}`} className="block">
        {/* Image container */}
        <div className="relative overflow-hidden bg-stone-100 aspect-[3/4] rounded-2xl shadow-card group-hover:shadow-card-hover transition-all duration-500">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-700 ease-out"
            loading="lazy"
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-950/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-b-2xl" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.featured && (
              <span className="bg-accent text-white text-[10px] px-2.5 py-1 font-bold tracking-widest uppercase rounded-full shadow-glow-sm">
                NEW
              </span>
            )}
            {product.stock === 0 && (
              <span className="bg-stone-800/90 text-white text-[10px] px-2.5 py-1 font-bold tracking-widest uppercase rounded-full backdrop-blur-sm">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Quick add button */}
          {product.stock > 0 && (
            <button
              onClick={handleQuickAdd}
              className="absolute bottom-3 left-3 right-3 glass text-stone-900 text-xs font-bold tracking-wider uppercase py-2.5 px-4
                         flex items-center justify-center gap-2 rounded-xl
                         opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0
                         transition-all duration-300 hover:bg-white active:scale-[0.97] cursor-pointer shadow-sm"
              aria-label={`Quick add ${product.name} to cart`}
            >
              <Plus size={12} strokeWidth={2.5} />
              Quick Add
            </button>
          )}
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-3 right-3">
        <WishlistButton
          productId={product.id}
          className="w-8 h-8 glass hover:bg-white shadow-sm flex items-center justify-center rounded-full transition-all cursor-pointer"
        />
      </div>

      {/* Info */}
      <div className="mt-3.5 px-0.5">
        <p className="text-[10px] text-stone-400 uppercase tracking-[0.18em] font-semibold">{product.category}</p>
        <h3 className="text-sm font-semibold text-stone-800 mt-0.5 leading-snug group-hover:text-accent transition-colors duration-200 line-clamp-1 font-heading">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-sm font-bold text-stone-900 font-heading">{formatPrice(product.price)}</p>
          {product.colors?.length > 0 && (
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 4).map((c, i) => (
                <div key={i}
                  className="w-3 h-3 rounded-full border border-stone-200 shadow-sm ring-1 ring-stone-100"
                  style={{ backgroundColor: c.toLowerCase() === 'white' ? '#fff' : c.toLowerCase() === 'black' ? '#111' : c }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[9px] text-stone-400 font-medium">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
