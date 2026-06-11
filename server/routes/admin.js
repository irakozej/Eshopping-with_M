const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/setup');
const { requireAdmin } = require('../middleware/auth');
const { sendStatusUpdate } = require('../utils/email');
const { createNotification } = require('./notifications');

const STATUS_LABEL = {
  pending: 'Pending', processing: 'Processing', shipped: 'Shipped',
  delivered: 'Delivered', cancelled: 'Cancelled', pending_payment: 'Pending payment',
};

const router = express.Router();

// Multer storage for product images
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

function parseProduct(p) {
  if (!p) return null;
  return {
    ...p,
    sizes: JSON.parse(p.sizes || '[]'),
    colors: JSON.parse(p.colors || '[]'),
    images: JSON.parse(p.images || '[]'),
    featured: Boolean(p.featured)
  };
}

// --- Products ---

// GET /api/admin/products
router.get('/products', requireAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products.map(parseProduct));
});

// POST /api/admin/products
router.post('/products', requireAdmin, upload.array('images', 10), (req, res) => {
  const { name, description, price, category, sizes, colors, stock, featured } = req.body;

  if (!name || !description || !price || !category) {
    return res.status(400).json({ error: 'name, description, price, and category are required' });
  }

  // Merge existing URLs (sent as JSON string) + newly uploaded files
  let existingUrls = [];
  try { existingUrls = req.body.images ? JSON.parse(req.body.images) : []; } catch {}
  const uploadedUrls = (req.files || []).map(f => `/uploads/${f.filename}`);
  const images = [...existingUrls, ...uploadedUrls];

  const result = db.prepare(`
    INSERT INTO products (name, description, price, category, sizes, colors, images, stock, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, description, Number(price), category,
    typeof sizes === 'string' ? sizes : JSON.stringify(sizes || []),
    typeof colors === 'string' ? colors : JSON.stringify(colors || []),
    JSON.stringify(images),
    Number(stock) || 0,
    featured === 'true' || featured === true ? 1 : 0
  );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseProduct(product));
});

// PUT /api/admin/products/:id
router.put('/products/:id', requireAdmin, upload.array('images', 10), (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { name, description, price, category, sizes, colors, stock, featured } = req.body;

  // Merge existing URLs (sent as JSON string) + newly uploaded files
  let existingUrls = [];
  try { existingUrls = req.body.images ? JSON.parse(req.body.images) : JSON.parse(product.images || '[]'); } catch {}
  const uploadedUrls = (req.files || []).map(f => `/uploads/${f.filename}`);
  const images = [...existingUrls, ...uploadedUrls];

  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, category=?, sizes=?, colors=?, images=?, stock=?, featured=?
    WHERE id=?
  `).run(
    name || product.name,
    description || product.description,
    price != null ? Number(price) : product.price,
    category || product.category,
    typeof sizes === 'string' ? sizes : JSON.stringify(sizes || JSON.parse(product.sizes)),
    typeof colors === 'string' ? colors : JSON.stringify(colors || JSON.parse(product.colors)),
    JSON.stringify(images),
    stock != null ? Number(stock) : product.stock,
    featured !== undefined ? (featured === 'true' || featured === true ? 1 : 0) : product.featured,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(parseProduct(updated));
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted' });
});

// --- Orders ---

// GET /api/admin/orders
router.get('/orders', requireAdmin, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o JOIN users u ON u.id = o.user_id
  `;
  const params = [];
  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  query += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json(orders.map(o => ({
    ...o,
    items: JSON.parse(o.items),
    shipping_address: JSON.parse(o.shipping_address)
  })));
});

// PUT /api/admin/orders/:id — update status
router.put('/orders/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const previousStatus = order.status;

  // Stock adjustments on cancellation state changes.
  if (previousStatus !== status) {
    let orderItems = [];
    try { orderItems = JSON.parse(order.items) || []; } catch {}
    if (status === 'cancelled') {
      // Cancelling: return reserved stock to the shelf.
      const restore = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const item of orderItems) restore.run(item.quantity, item.product_id);
    } else if (previousStatus === 'cancelled') {
      // Un-cancelling: re-reserve stock; refuse if items have since sold out.
      const reserve = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
      const reserveAll = db.transaction(() => {
        for (const item of orderItems) {
          const { changes } = reserve.run(item.quantity, item.product_id, item.quantity);
          if (changes !== 1) throw Object.assign(new Error(`Cannot reactivate: "${item.name}" no longer has enough stock.`), { code: 'OUT_OF_STOCK' });
        }
      });
      try { reserveAll(); } catch (err) {
        if (err.code === 'OUT_OF_STOCK') return res.status(409).json({ error: err.message });
        throw err;
      }
    }
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?
  `).get(req.params.id);

  // Send status update email (non-blocking)
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(order.user_id);
  if (user) sendStatusUpdate(user, { ...updated, items: JSON.parse(updated.items) }).catch(() => {});

  // Admin feed: record the status change
  if (previousStatus !== status) {
    createNotification(
      'order',
      `Order #${req.params.id} → ${STATUS_LABEL[status] || status}`,
      `${updated.user_name || 'Customer'}'s order moved from ${STATUS_LABEL[previousStatus] || previousStatus} to ${STATUS_LABEL[status] || status}`,
      '/admin/orders'
    );
    // Customer's personal feed
    createNotification(
      'order',
      `Your order #${req.params.id} is ${STATUS_LABEL[status] || status}`,
      `Order #${req.params.id} is now marked ${STATUS_LABEL[status] || status}.`,
      `/orders/${req.params.id}`,
      order.user_id
    );
  }

  res.json({
    ...updated,
    items: JSON.parse(updated.items),
    shipping_address: JSON.parse(updated.shipping_address)
  });
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) as r FROM orders WHERE status != 'cancelled'").get().r;
  const pendingRequests = db.prepare("SELECT COUNT(*) as c FROM product_requests WHERE status = 'pending'").get().c;
  const recentOrders = db.prepare(`
    SELECT o.id, o.total, o.status, o.created_at, u.name as user_name
    FROM orders o JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();
  const recentRequests = db.prepare(`
    SELECT pr.id, pr.name, pr.status, pr.created_at, u.name as user_name
    FROM product_requests pr JOIN users u ON u.id = pr.user_id
    ORDER BY pr.created_at DESC LIMIT 5
  `).all();
  res.json({ totalProducts, totalOrders, totalUsers, revenue, pendingRequests, recentOrders, recentRequests });
});

// GET /api/admin/low-stock
router.get('/low-stock', requireAdmin, (req, res) => {
  const threshold = Number(req.query.threshold || 5);
  const products = db.prepare('SELECT id, name, category, stock, images FROM products WHERE stock <= ? ORDER BY stock ASC').all(threshold);
  res.json(products.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })));
});

module.exports = router;
