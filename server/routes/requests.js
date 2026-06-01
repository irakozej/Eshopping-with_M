const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/setup');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const nodemailer = require('nodemailer');

const router = express.Router();

const STATUS_MESSAGES = {
  reviewing: 'Great news! Our team is reviewing your request and will get back to you soon.',
  fulfilled: 'Your requested product is now available in our store! Check it out.',
  rejected: 'Unfortunately, we were unable to source this product at this time.',
};

async function sendRequestStatusEmail(req) {
  const msg = STATUS_MESSAGES[req.status] || `Your request status has been updated to: ${req.status}`;
  const statusLabel = { pending: 'Pending', reviewing: 'Reviewing', fulfilled: 'Available!', rejected: 'Unavailable' }[req.status] || req.status;

  let transporter;
  if (!process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  const info = await transporter.sendMail({
    from: `"M·Shop" <${process.env.SMTP_FROM || 'noreply@mshop.rw'}>`,
    to: req.user_email,
    subject: `Your Request Update — ${req.name} | M·Shop`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#1A140F;padding:24px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:3px;">M·<span style="color:#C8873A;">SHOP</span></h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="font-weight:400;">Product Request Update</h2>
          <p>Hi ${req.user_name},</p>
          <div style="background:#faf8f5;border:1px solid #e5ddd3;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:12px;color:#9b9b9b;text-transform:uppercase;">Your Request</p>
            <p style="margin:0;font-weight:600;">${req.name}</p>
          </div>
          <div style="padding:12px 16px;background:#f0f9ff;border-left:4px solid #C8873A;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:11px;color:#9b9b9b;text-transform:uppercase;">Status</p>
            <p style="margin:0;font-weight:700;color:#C8873A;">${statusLabel}</p>
          </div>
          <p>${msg}</p>
          ${req.admin_note ? `<p style="margin-top:16px;padding:12px;background:#f9f9f9;border-left:3px solid #ccc;font-size:13px;color:#555;">Note from our team: ${req.admin_note}</p>` : ''}
        </div>
        <div style="padding:16px 24px;background:#f9f9f9;text-align:center;font-size:11px;color:#9b9b9b;">
          M·Shop Rwanda · KG 11 Ave, Kigali · hello@mshop.rw
        </div>
      </div>
    `,
  });
  if (info.message) console.log('[EMAIL DEV]', JSON.parse(info.message).subject, '→', req.user_email);
}

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `req-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
});

// POST /api/requests — customer submits a product request
router.post('/', authenticate, upload.array('images', 5), (req, res) => {
  const { name, description, category, budget } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }

  const images = req.files?.length
    ? req.files.map(f => `/uploads/${f.filename}`)
    : [];

  const result = db.prepare(`
    INSERT INTO product_requests (user_id, name, description, category, budget, images, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(req.user.id, name, description, category || 'other', budget || '', JSON.stringify(images));

  const request = db.prepare('SELECT * FROM product_requests WHERE id = ?').get(result.lastInsertRowid);

  // Notify admin
  const requester = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  createNotification(
    'request',
    `New Product Request`,
    `${requester?.name || 'A customer'} requested: ${name}`,
    '/admin/requests'
  );

  res.status(201).json({ ...request, images: JSON.parse(request.images) });
});

// GET /api/requests — get current user's requests
router.get('/', authenticate, (req, res) => {
  const requests = db.prepare(
    'SELECT * FROM product_requests WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json(requests.map(r => ({ ...r, images: JSON.parse(r.images) })));
});

// GET /api/admin/requests — all requests (admin)
router.get('/admin', requireAdmin, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT pr.*, u.name as user_name, u.email as user_email
    FROM product_requests pr JOIN users u ON u.id = pr.user_id
  `;
  const params = [];
  if (status) { query += ' WHERE pr.status = ?'; params.push(status); }
  query += ' ORDER BY pr.created_at DESC';
  const requests = db.prepare(query).all(...params);
  res.json(requests.map(r => ({ ...r, images: JSON.parse(r.images) })));
});

// PUT /api/requests/admin/:id — admin updates status/note
router.put('/admin/:id', requireAdmin, (req, res) => {
  const { status, admin_note } = req.body;
  const valid = ['pending', 'reviewing', 'fulfilled', 'rejected'];
  if (status && !valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
  }
  const request = db.prepare('SELECT * FROM product_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const noteChanged = admin_note !== undefined && admin_note !== request.admin_note;
  const statusChanged = status && status !== request.status;

  db.prepare('UPDATE product_requests SET status = ?, admin_note = ? WHERE id = ?').run(
    status || request.status,
    admin_note !== undefined ? admin_note : request.admin_note,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT pr.*, u.name as user_name, u.email as user_email
    FROM product_requests pr JOIN users u ON u.id = pr.user_id WHERE pr.id = ?
  `).get(req.params.id);

  // Email customer if status changed
  if (statusChanged && updated.user_email) {
    sendRequestStatusEmail(updated).catch(() => {});
  }

  // Admin feed: record the reply (status change or note)
  if (statusChanged || noteChanged) {
    const STATUS_LABEL = { pending: 'Pending', reviewing: 'Reviewing', fulfilled: 'Fulfilled', rejected: 'Rejected' };
    const parts = [];
    if (statusChanged) parts.push(`status: ${STATUS_LABEL[updated.status] || updated.status}`);
    if (noteChanged) parts.push(`note added`);
    createNotification(
      'request',
      `Reply sent — ${updated.name}`,
      `${updated.user_name || 'Customer'}'s request updated (${parts.join(', ')})`,
      '/admin/requests'
    );
  }

  res.json({ ...updated, images: JSON.parse(updated.images) });
});

module.exports = router;
