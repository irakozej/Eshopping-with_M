const express = require('express');
const db = require('../db/setup');
const { authenticate } = require('../middleware/auth');
const momo = require('../utils/momo');

const router = express.Router();

// GET /api/payments/momo-status/:referenceId
// Poll the status of an MTN MoMo payment. Updates order status when successful.
router.get('/momo-status/:referenceId', authenticate, async (req, res) => {
  const { referenceId } = req.params;

  if (!momo.isConfigured()) {
    return res.status(503).json({
      error: 'MTN MoMo is not configured on this server. Please set MOMO_SUBSCRIPTION_KEY, MOMO_API_USER_ID, and MOMO_API_KEY in your .env file.',
    });
  }

  try {
    const { status, reason } = await momo.getPaymentStatus(referenceId);

    // If payment succeeded, mark the order as confirmed
    if (status === 'SUCCESSFUL') {
      const order = db.prepare(
        'SELECT * FROM orders WHERE stripe_payment_id = ? AND user_id = ?'
      ).get(referenceId, req.user.id);

      if (order && order.status === 'pending') {
        db.prepare("UPDATE orders SET status = 'processing' WHERE id = ?").run(order.id);
      }
    }

    res.json({ status, reason: reason || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/create-intent (Stripe — kept for card payments)
// Gated behind PAYMENTS_STRIPE_ENABLED: the route stays registered, but returns
// 503 unless card payments are explicitly enabled.
router.post('/create-intent', authenticate, (req, res) => {
  if (process.env.PAYMENTS_STRIPE_ENABLED !== 'true') {
    return res.status(503).json({ error: 'Card payments are currently disabled.' });
  }
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { amount } = req.body;
  if (!amount || amount < 50) return res.status(400).json({ error: 'Invalid amount' });

  stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency: 'rwf',
    automatic_payment_methods: { enabled: true },
  })
    .then(intent => res.json({ clientSecret: intent.client_secret }))
    .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;
