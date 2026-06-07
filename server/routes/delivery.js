const express = require('express');
const db = require('../db/setup');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const FREE_THRESHOLD = Number(process.env.DELIVERY_FREE_THRESHOLD_RWF) || 50000;
const DEFAULT_DAYS = Number(process.env.DELIVERY_DEFAULT_DAYS) || 1;

// GET /api/delivery/zones — public. Active zones + delivery config for checkout.
router.get('/zones', (req, res) => {
  const zones = db.prepare(
    'SELECT id, name, fee, is_placeholder FROM delivery_zones WHERE active = 1 ORDER BY sort_order, id'
  ).all();
  res.json({
    zones,
    free_threshold: FREE_THRESHOLD,
    default_days: DEFAULT_DAYS,
  });
});

// --- Admin endpoints ---

// GET /api/delivery/admin/zones — all zones (incl. inactive)
router.get('/admin/zones', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM delivery_zones ORDER BY sort_order, id').all());
});

// POST /api/delivery/admin/zones — create a zone
router.post('/admin/zones', requireAdmin, (req, res) => {
  const { name, fee, active } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Zone name is required' });
  if (fee === undefined || fee === null || isNaN(Number(fee)) || Number(fee) < 0) {
    return res.status(400).json({ error: 'A valid fee (RWF, 0 or more) is required' });
  }
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM delivery_zones').get().m;
  const result = db.prepare(
    'INSERT INTO delivery_zones (name, fee, active, is_placeholder, sort_order) VALUES (?, ?, ?, 0, ?)'
  ).run(name.trim(), Number(fee), active !== undefined ? (active ? 1 : 0) : 1, maxOrder + 1);
  res.status(201).json(db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/delivery/admin/zones/:id — edit name / fee / active.
// Editing a placeholder clears the placeholder flag (it now holds real data).
router.put('/admin/zones/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Zone not found' });

  const name = req.body.name !== undefined ? String(req.body.name).trim() : existing.name;
  const fee = req.body.fee !== undefined ? Number(req.body.fee) : existing.fee;
  const active = req.body.active !== undefined ? (req.body.active ? 1 : 0) : existing.active;

  if (!name) return res.status(400).json({ error: 'Zone name is required' });
  if (isNaN(fee) || fee < 0) return res.status(400).json({ error: 'A valid fee (RWF, 0 or more) is required' });

  const edited = req.body.name !== undefined || req.body.fee !== undefined;
  const isPlaceholder = edited ? 0 : existing.is_placeholder;

  db.prepare(
    'UPDATE delivery_zones SET name = ?, fee = ?, active = ?, is_placeholder = ? WHERE id = ?'
  ).run(name, fee, active, isPlaceholder, req.params.id);
  res.json(db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(req.params.id));
});

// DELETE /api/delivery/admin/zones/:id
router.delete('/admin/zones/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM delivery_zones WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
