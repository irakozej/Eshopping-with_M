const express = require('express');
const db = require('../db/setup');
const { authenticate } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../utils/email');
const { createNotification } = require('./notifications');
const momo = require('../utils/momo');

const formatRWF = (n) => `RWF ${Math.round(n).toLocaleString('en-US')}`;

const router = express.Router();

// POST /api/orders
router.post('/', authenticate, async (req, res) => {
  const { shipping_address, stripe_payment_id, discount_code, payment_method, shipping_fee: clientShippingFee, mtn_phone } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  const cartItems = db.prepare(`
    SELECT ci.*, p.name, p.price, p.images
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  const items = cartItems.map(item => ({
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    images: JSON.parse(item.images || '[]'),
  }));

  let subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discountAmount = 0;
  let discountInfo = null;

  // Apply discount code if provided
  if (discount_code) {
    const discount = db.prepare(`
      SELECT * FROM discount_codes WHERE UPPER(code) = UPPER(?) AND active = 1
    `).get(discount_code.trim());

    if (discount) {
      if (discount.type === 'percent') {
        discountAmount = Math.round(subtotal * discount.value / 100);
      } else {
        discountAmount = Math.min(discount.value, subtotal);
      }
      discountInfo = { code: discount.code, type: discount.type, value: discount.value, discountAmount };
      db.prepare('UPDATE discount_codes SET uses = uses + 1 WHERE id = ?').run(discount.id);
    }
  }

  // Shipping fee — use client-provided value
  const SHIPPING_THRESHOLD = 50000;
  let shippingFee = 0;
  if (clientShippingFee !== undefined && clientShippingFee !== null) {
    shippingFee = Math.max(0, Number(clientShippingFee) || 0);
  } else {
    shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : 2000;
  }

  const total = Math.max(0, subtotal - discountAmount) + shippingFee;
  const isMtn = payment_method === 'MTN Mobile Money';

  // For MoMo: use the reference ID as the payment ID so we can poll later
  let paymentId = stripe_payment_id || null;
  let momoReferenceId = null;

  // Insert order first (status = pending_payment for MoMo, pending for card)
  const orderStatus = isMtn ? 'pending_payment' : 'pending';

  const result = db.prepare(`
    INSERT INTO orders (user_id, items, total, shipping_address, status, stripe_payment_id, payment_method, discount_code, discount_amount, shipping_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    JSON.stringify(items),
    total,
    JSON.stringify(shipping_address),
    orderStatus,
    paymentId,
    payment_method || 'card',
    discount_code || null,
    discountAmount,
    shippingFee,
  );

  const orderId = result.lastInsertRowid;

  // ── MTN MoMo: send payment push to customer's phone ──
  if (isMtn) {
    if (!mtn_phone) {
      return res.status(400).json({ error: 'MTN phone number is required for Mobile Money payment.' });
    }

    if (!momo.isConfigured()) {
      // MoMo not configured — update order to pending and continue (demo mode)
      db.prepare("UPDATE orders SET status = 'pending', stripe_payment_id = ? WHERE id = ?")
        .run(`mtn_demo_${mtn_phone}_${Date.now()}`, orderId);
    } else {
      try {
        momoReferenceId = await momo.requestToPay({
          phone: mtn_phone,
          amount: total,
          orderId,
          description: `M·Shop Order #${orderId}`,
        });

        // Store the MoMo reference ID so status can be polled
        db.prepare('UPDATE orders SET stripe_payment_id = ? WHERE id = ?')
          .run(momoReferenceId, orderId);
      } catch (err) {
        // MoMo push failed — delete the order and return error
        db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
        // Restore discount usage
        if (discount_code && discountInfo) {
          db.prepare('UPDATE discount_codes SET uses = uses - 1 WHERE UPPER(code) = UPPER(?)').run(discount_code);
        }
        return res.status(502).json({
          error: `MTN MoMo payment initiation failed: ${err.message}. Please check your phone number and try again.`,
        });
      }
    }
  }

  // Clear cart only after successful order creation
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const parsed = {
    ...order,
    items: JSON.parse(order.items),
    shipping_address: JSON.parse(order.shipping_address),
    discount: discountInfo,
    momoReferenceId: momoReferenceId || null,
    momoConfigured: isMtn ? momo.isConfigured() : undefined,
  };

  // Send confirmation email + admin notification
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user.id);
  if (!isMtn || !momo.isConfigured()) {
    // For card or demo MoMo, send confirmation immediately
    sendOrderConfirmation(user, parsed).catch(() => {});
  }
  createNotification(
    'order',
    `New Order #${orderId}`,
    `${user?.name || 'A customer'} placed an order for ${formatRWF(total)}`,
    '/admin/orders'
  );
  // Customer's personal feed
  createNotification(
    'order',
    `Order #${orderId} placed`,
    `Thanks for your order of ${formatRWF(total)}. We'll let you know as it progresses.`,
    '/orders',
    req.user.id
  );

  res.status(201).json(parsed);
});

// GET /api/orders
router.get('/', authenticate, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(orders.map(o => ({
    ...o,
    items: JSON.parse(o.items),
    shipping_address: JSON.parse(o.shipping_address),
  })));
});

// GET /api/orders/:id
router.get('/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...order, items: JSON.parse(order.items), shipping_address: JSON.parse(order.shipping_address) });
});

module.exports = router;
