require('./instrument');
const express = require('express');
const cors = require('cors');
const path = require('path');
const Sentry = require('@sentry/node');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const requestRoutes = require('./routes/requests');
const reviewRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const discountRoutes = require('./routes/discounts');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5174', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/products', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Sentry test endpoint (no-op when DSN unset)
app.get('/api/debug-sentry', (req, res, next) => {
  next(new Error('Sentry backend test error'));
});

Sentry.setupExpressErrorHandler(app);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
