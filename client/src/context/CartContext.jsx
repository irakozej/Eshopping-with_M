import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { trackEvent } from '../lib/analytics';

const CartContext = createContext(null);

// Guest cart stored in localStorage
function getLocalCart() {
  try { return JSON.parse(localStorage.getItem('guestCart')) || []; } catch { return []; }
}
function saveLocalCart(items) {
  localStorage.setItem('guestCart', JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems(getLocalCart());
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, size, color, quantity = 1) => {
    trackEvent('add_to_cart', {
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
    if (!user) {
      const current = getLocalCart();
      const idx = current.findIndex(
        i => i.product_id === product.id && i.size === size && i.color === color
      );
      if (idx >= 0) {
        current[idx].quantity += quantity;
      } else {
        current.push({
          id: Date.now(),
          product_id: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          size,
          color,
          quantity
        });
      }
      saveLocalCart(current);
      setItems([...current]);
      return;
    }
    const res = await api.post('/cart', { product_id: product.id, size, color, quantity });
    setItems(res.data);
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!user) {
      const current = getLocalCart().map(i => i.id === itemId ? { ...i, quantity } : i);
      saveLocalCart(current);
      setItems(current);
      return;
    }
    const res = await api.put(`/cart/${itemId}`, { quantity });
    setItems(res.data);
  };

  const removeItem = async (itemId) => {
    if (!user) {
      const current = getLocalCart().filter(i => i.id !== itemId);
      saveLocalCart(current);
      setItems(current);
      return;
    }
    const res = await api.delete(`/cart/${itemId}`);
    setItems(res.data);
  };

  const clearCart = async () => {
    if (!user) {
      saveLocalCart([]);
      setItems([]);
      return;
    }
    await api.delete('/cart');
    setItems([]);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeItem, clearCart, itemCount, subtotal, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
