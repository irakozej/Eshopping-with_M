const express = require('express');
const db = require('../db/setup');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/discounts/validate — check a code and return discount info (public)
router.post('/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const discount = db.prepare(`
    SELECT * FROM discount_codes
    WHERE UPPER(code) = UPPER(?) AND active = 1
  `).get(code.trim());

  if (!discount) return res.status(404).json({ error: 'Invalid or expired discount code' });
  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This discount code has expired' });
  }
  if (discount.max_uses && discount.uses >= discount.max_uses) {
    return res.status(400).json({ error: 'This discount code has reached its usage limit' });
  }
  if (subtotal && subtotal < discount.min_order) {
    return res.status(400).json({
      error: `Minimum order of RWF ${Math.round(discount.min_order).toLocaleString()} required for this code`
    });
  }

  let discountAmount = 0;
  if (discount.type === 'percent') {
    discountAmount = Math.round((subtotal || 0) * discount.value / 100);
  } else {
    discountAmount = Math.min(discount.value, subtotal || discount.value);
  }

  res.json({
    code: discount.code,
    type: discount.type,
    value: discount.value,
    amount: discountAmount,
    message: discount.type === 'percent'
      ? `${discount.value}% off applied!`
      : `RWF ${Math.round(discount.value).toLocaleString()} off applied!`
  });
});

// --- Admin endpoints ---

// GET /api/discounts/admin
router.get('/admin', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM discount_codes ORDER BY created_at DESC').all());
});

// POST /api/discounts/admin
router.post('/admin', requireAdmin, (req, res) => {
  const { code, type, value, min_order, max_uses, expires_at, active } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'code and value are required' });

  try {
    const result = db.prepare(`
      INSERT INTO discount_codes (code, type, value, min_order, max_uses, expires_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(code.toUpperCase().trim(), type || 'percent', Number(value), Number(min_order || 0), max_uses || null, expires_at || null, active !== undefined ? (active ? 1 : 0) : 1);
    res.status(201).json(db.prepare('SELECT * FROM discount_codes WHERE id = ?').get(result.lastInsertRowid));
  } catch {
    res.status(409).json({ error: 'A discount code with that name already exists' });
  }
});

// PUT /api/discounts/admin/:id
router.put('/admin/:id', requireAdmin, (req, res) => {
  const { active } = req.body;
  db.prepare('UPDATE discount_codes SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM discount_codes WHERE id = ?').get(req.params.id));
});

// DELETE /api/discounts/admin/:id
router.delete('/admin/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM discount_codes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
