const express = require('express');
const db = require('../db/setup');

const router = express.Router();

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

// GET /api/products
router.get('/', (req, res) => {
  const { category, size, color, minPrice, maxPrice, search, featured, sort, page = 1, limit = 12 } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(Number(maxPrice));
  }
  if (featured === 'true') {
    query += ' AND featured = 1';
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countQuery).get(...params).total;

  const offset = (Number(page) - 1) * Number(limit);
  const SORT_MAP = {
    newest: 'created_at DESC',
    'price-asc': 'price ASC',
    'price-desc': 'price DESC',
    featured: 'featured DESC, created_at DESC',
  };
  const orderBy = SORT_MAP[sort] || 'created_at DESC';
  query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  let products = db.prepare(query).all(...params).map(parseProduct);

  // Filter by size and color (stored as JSON arrays)
  if (size) {
    products = products.filter(p => p.sizes.includes(size));
  }
  if (color) {
    products = products.filter(p => p.colors.some(c => c.toLowerCase().includes(color.toLowerCase())));
  }

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(parseProduct(product));
});

module.exports = router;
