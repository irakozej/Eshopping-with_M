const express = require('express');
const db = require('../db/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/products/:id/reviews
router.get('/:productId/reviews', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.id, r.user_id, r.rating, r.comment, r.created_at, u.name as user_name
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.productId);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      ROUND(AVG(rating), 1) as average,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one
    FROM reviews WHERE product_id = ?
  `).get(req.params.productId);

  res.json({ reviews, stats });
});

// POST /api/products/:id/reviews
router.post('/:productId/reviews', authenticate, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(req.params.productId, req.user.id, rating, comment || null);

    const review = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
      FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(review);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }
    throw err;
  }
});

// DELETE /api/products/:id/reviews (own review)
router.delete('/:productId/reviews', authenticate, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE product_id = ? AND user_id = ?').run(req.params.productId, req.user.id);
  res.json({ message: 'Review deleted' });
});

module.exports = router;
