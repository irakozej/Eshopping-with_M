const express = require('express');
const db = require('../db/setup');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Scope notifications by role:
//   admin    → the store feed (user_id IS NULL)
//   customer → their own personal feed (user_id = their id)
function scopeFor(req) {
  if (req.user.role === 'admin') return { where: 'user_id IS NULL', params: [] };
  return { where: 'user_id = ?', params: [req.user.id] };
}

// GET /api/notifications — last 30 for the current user's scope
router.get('/', authenticate, (req, res) => {
  const { where, params } = scopeFor(req);
  const notifications = db.prepare(
    `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT 30`
  ).all(...params);
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, (req, res) => {
  const { where, params } = scopeFor(req);
  const { count } = db.prepare(
    `SELECT COUNT(*) as count FROM notifications WHERE ${where} AND read = 0`
  ).get(...params);
  res.json({ count });
});

// PUT /api/notifications/read-all — mark all in scope as read
router.put('/read-all', authenticate, (req, res) => {
  const { where, params } = scopeFor(req);
  db.prepare(`UPDATE notifications SET read = 1 WHERE ${where}`).run(...params);
  res.json({ ok: true });
});

// PUT /api/notifications/:id/read — only within the caller's scope
router.put('/:id/read', authenticate, (req, res) => {
  const { where, params } = scopeFor(req);
  db.prepare(`UPDATE notifications SET read = 1 WHERE id = ? AND ${where}`)
    .run(req.params.id, ...params);
  res.json({ ok: true });
});

module.exports = router;

// Helper to create a notification (used internally by other routes).
// userId = null → store/admin feed; userId = <id> → that customer's feed.
module.exports.createNotification = (type, title, body, link = null, userId = null) => {
  try {
    db.prepare(
      'INSERT INTO notifications (type, title, body, link, user_id) VALUES (?, ?, ?, ?, ?)'
    ).run(type, title, body, link, userId);
  } catch {}
};
