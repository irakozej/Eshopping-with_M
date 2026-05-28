import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  const fetchIds = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    try {
      const res = await api.get('/wishlist/ids');
      setIds(new Set(res.data));
    } catch {
      setIds(new Set());
    }
  }, [user]);

  useEffect(() => { fetchIds(); }, [fetchIds]);

  const toggle = async (productId) => {
    if (!user) return false; // caller should redirect to login
    const res = await api.post('/wishlist', { product_id: productId });
    setIds(prev => {
      const next = new Set(prev);
      if (res.data.action === 'added') next.add(productId);
      else next.delete(productId);
      return next;
    });
    return res.data.action;
  };

  const isWishlisted = (productId) => ids.has(productId);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isWishlisted, fetchIds }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
