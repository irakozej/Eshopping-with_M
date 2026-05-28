import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

export default function WishlistButton({ productId, className = '' }) {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();
  const wishlisted = isWishlisted(productId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    const action = await toggle(productId);
    if (action === 'added') toast('Added to wishlist', 'success', 2000);
    else toast('Removed from wishlist', 'info', 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={`transition-all duration-200 ${className}`}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={18}
        className={wishlisted ? 'fill-red-500 text-red-500' : 'text-stone-400 hover:text-red-400'}
        strokeWidth={wishlisted ? 0 : 1.5}
      />
    </button>
  );
}
