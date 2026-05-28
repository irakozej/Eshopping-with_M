const express = require('express');
const db = require('../db/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function getCartWithDetails(userId) {
  const items = db.prepare(`
    SELECT ci.id, ci.product_id, ci.size, ci.color, ci.quantity,
           p.name, p.price, p.images, p.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `).all(userId);

  return items.map(item => ({
    ...item,
    images: JSON.parse(item.images || '[]')
  }));
}

// GET /api/cart
router.get('/', authenticate, (req, res) => {
  const items = getCartWithDetails(req.user.id);
  res.json(items);
});

// POST /api/cart
router.post('/', authenticate, (req, res) => {
  const { product_id, size, color, quantity = 1 } = req.body;
  if (!product_id || !size || !color) {
    return res.status(400).json({ error: 'product_id, size, and color are required' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Check if item already exists in cart
  const existing = db.prepare(
    'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?'
  ).get(req.user.id, product_id, size, color);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare(
      'INSERT INTO cart_items (user_id, product_id, size, color, quantity) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, product_id, size, color, quantity);
  }

  const items = getCartWithDetails(req.user.id);
  res.json(items);
});

// PUT /api/cart/:id
router.put('/:id', authenticate, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  }

  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
  const items = getCartWithDetails(req.user.id);
  res.json(items);
});

// DELETE /api/cart/:id
router.delete('/:id', authenticate, (req, res) => {
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
  const items = getCartWithDetails(req.user.id);
  res.json(items);
});

// DELETE /api/cart (clear entire cart)
router.delete('/', authenticate, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json([]);
});

module.exports = router;
