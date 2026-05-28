const express = require('express');
const db = require('../db/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function parseProduct(p) {
  return { ...p, sizes: JSON.parse(p.sizes || '[]'), colors: JSON.parse(p.colors || '[]'), images: JSON.parse(p.images || '[]') };
}

// GET /api/wishlist
router.get('/', authenticate, (req, res) => {
  const items = db.prepare(`
    SELECT w.id, w.product_id, w.created_at, p.name, p.price, p.category, p.images, p.stock, p.sizes, p.colors
    FROM wishlist w JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ? ORDER BY w.created_at DESC
  `).all(req.user.id);
  res.json(items.map(i => ({ ...i, images: JSON.parse(i.images || '[]'), sizes: JSON.parse(i.sizes || '[]'), colors: JSON.parse(i.colors || '[]') })));
});

// POST /api/wishlist — toggle (add if not exists, remove if exists)
router.post('/', authenticate, (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  if (existing) {
    db.prepare('DELETE FROM wishlist WHERE id = ?').run(existing.id);
    return res.json({ action: 'removed', product_id });
  }
  db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
  res.json({ action: 'added', product_id });
});

// DELETE /api/wishlist/:id
router.delete('/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Removed from wishlist' });
});

// GET /api/wishlist/ids — just the product IDs for quick checks
router.get('/ids', authenticate, (req, res) => {
  const ids = db.prepare('SELECT product_id FROM wishlist WHERE user_id = ?').all(req.user.id).map(r => r.product_id);
  res.json(ids);
});

module.exports = router;
