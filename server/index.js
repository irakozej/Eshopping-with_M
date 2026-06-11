require('./instrument');
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
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
const deliveryRoutes = require('./routes/delivery');

// Refuse to start production with a missing/weak JWT secret — every session
// token is signed with it.
const WEAK_SECRETS = ['eshopping_jwt_secret_mvp_2024', 'change_me_in_production'];
if (process.env.NODE_ENV === 'production'
    && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || WEAK_SECRETS.includes(process.env.JWT_SECRET))) {
  console.error('✗ FATAL: JWT_SECRET is missing or weak. Generate one with: openssl rand -hex 32');
  process.exit(1);
}

const app = express();

// Behind a reverse proxy (production) the client IP arrives in X-Forwarded-For;
// trust one hop so rate limiting keys on the real client, not the proxy.
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  // Uploads are consumed from the frontend origin; default same-origin CORP
  // would block product images in dev (5174) and any separate prod domain.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5174', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limits on the sensitive surfaces. Auth gets the tightest budget
// (brute-force protection); payments a slightly looser one (status polling).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many payment requests. Please slow down and try again shortly.' },
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/products', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/delivery', deliveryRoutes);

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
