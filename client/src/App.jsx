import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { trackPageview } from './lib/analytics';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { ProtectedRoute, AdminRoute, CustomerRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import ProductRequest from './pages/ProductRequest';
import MyRequests from './pages/MyRequests';
import About from './pages/About';
import ReturnPolicy from './pages/policies/ReturnPolicy';
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import TermsConditions from './pages/policies/TermsConditions';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminRequests from './pages/admin/AdminRequests';
import AdminDiscounts from './pages/admin/AdminDiscounts';
import AdminSettings from './pages/admin/AdminSettings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageview();
  }, [pathname]);
  return null;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <Layout>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/policies/returns" element={<ReturnPolicy />} />
                  <Route path="/policies/privacy" element={<PrivacyPolicy />} />
                  <Route path="/policies/terms" element={<TermsConditions />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Customer only */}
                  <Route path="/checkout" element={<CustomerRoute><Checkout /></CustomerRoute>} />
                  <Route path="/request" element={<CustomerRoute><ProductRequest /></CustomerRoute>} />
                  <Route path="/my-requests" element={<CustomerRoute><MyRequests /></CustomerRoute>} />
                  <Route path="/wishlist" element={<CustomerRoute><Wishlist /></CustomerRoute>} />
                  <Route path="/orders" element={<CustomerRoute><Orders /></CustomerRoute>} />
                  <Route path="/profile" element={<CustomerRoute><Profile /></CustomerRoute>} />

                  {/* Admin only */}
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                  <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                  <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
                  <Route path="/admin/discounts" element={<AdminRoute><AdminDiscounts /></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                  {/* 404 */}
                  <Route path="*" element={
                    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center px-4">
                      <p className="text-9xl font-heading font-bold text-gradient leading-none">404</p>
                      <p className="text-2xl font-heading font-light text-stone-700 mt-2">Page not found</p>
                      <p className="text-sm text-stone-400 mb-6 max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
                      <a href="/" className="btn-primary px-8 py-3">Go Home</a>
                    </div>
                  } />
                </Routes>
              </Layout>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
