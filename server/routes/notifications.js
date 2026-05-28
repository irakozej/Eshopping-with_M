const express = require('express');
const db = require('../db/setup');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — admin only, last 30
router.get('/', requireAdmin, (req, res) => {
  const notifications = db.prepare(
    'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30'
  ).all();
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', requireAdmin, (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get();
  res.json({ count });
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', requireAdmin, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1').run();
  res.json({ ok: true });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAdmin, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

// Helper to create a notification (used internally by other routes)
module.exports.createNotification = (type, title, body, link = null) => {
  try {
    db.prepare(
      'INSERT INTO notifications (type, title, body, link) VALUES (?, ?, ?, ?)'
    ).run(type, title, body, link);
  } catch {}
};
