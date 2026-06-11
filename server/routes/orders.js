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
  const { shipping_address, stripe_payment_id, discount_code, payment_method, delivery_zone_id, mtn_phone } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  const cartItems = db.prepare(`
    SELECT ci.*, p.name, p.price, p.images, p.stock
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // Stock check before any money is computed or discount uses consumed.
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(409).json({
        error: item.stock > 0
          ? `Only ${item.stock} left in stock for "${item.name}" — please update your cart.`
          : `"${item.name}" is out of stock — please remove it from your cart.`,
      });
    }
  }

  const items = cartItems.map(item => ({
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    images: JSON.parse(item.images || '[]'),
  }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discountAmount = 0;
  let discountInfo = null;

  // Apply discount code if provided — full server-side validation
  // (active, expiry, usage limit, minimum order). Invalid codes reject the
  // order rather than silently charging full price.
  if (discount_code) {
    const discount = db.prepare(`
      SELECT * FROM discount_codes WHERE UPPER(code) = UPPER(?) AND active = 1
    `).get(discount_code.trim());

    if (!discount) {
      return res.status(400).json({ error: 'Invalid discount code' });
    }
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This discount code has expired' });
    }
    if (discount.max_uses && discount.uses >= discount.max_uses) {
      return res.status(400).json({ error: 'This discount code has reached its usage limit' });
    }
    if (subtotal < (discount.min_order || 0)) {
      return res.status(400).json({
        error: `Minimum order of RWF ${Math.round(discount.min_order).toLocaleString('en-US')} required for this code`,
      });
    }

    if (discount.type === 'percent') {
      discountAmount = Math.round(subtotal * discount.value / 100);
    } else {
      discountAmount = Math.min(discount.value, subtotal);
    }
    discountInfo = { code: discount.code, type: discount.type, value: discount.value, discountAmount };
    db.prepare('UPDATE discount_codes SET uses = uses + 1 WHERE id = ?').run(discount.id);
  }

  // Shipping fee — computed server-side from the delivery zone; the client's
  // displayed fee is never trusted. 'pickup' (or no zone) means free pickup.
  const FREE_THRESHOLD = Number(process.env.DELIVERY_FREE_THRESHOLD_RWF) || 50000;
  let shippingFee = 0;
  if (delivery_zone_id !== undefined && delivery_zone_id !== null && delivery_zone_id !== 'pickup') {
    const zone = db.prepare('SELECT * FROM delivery_zones WHERE id = ? AND active = 1').get(delivery_zone_id);
    if (!zone) {
      return res.status(400).json({ error: 'Selected delivery zone is no longer available. Please choose again.' });
    }
    shippingFee = subtotal >= FREE_THRESHOLD ? 0 : zone.fee;
    shipping_address.zone = zone.name; // authoritative zone label on the order
  }

  const total = Math.max(0, subtotal - discountAmount) + shippingFee;
  const isMtn = payment_method === 'MTN Mobile Money';

  // For MoMo: use the reference ID as the payment ID so we can poll later
  let paymentId = stripe_payment_id || null;
  let momoReferenceId = null;

  // Insert order first (status = pending_payment for MoMo, pending for card)
  const orderStatus = isMtn ? 'pending_payment' : 'pending';

  // Insert the order and decrement stock atomically; the stock guard in the
  // UPDATE means a concurrent order can't oversell.
  const placeOrder = db.transaction(() => {
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
    const decrement = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
    for (const item of cartItems) {
      const { changes } = decrement.run(item.quantity, item.product_id, item.quantity);
      if (changes !== 1) throw Object.assign(new Error(`"${item.name}" just sold out — please update your cart.`), { code: 'OUT_OF_STOCK' });
    }
    return result.lastInsertRowid;
  });

  let orderId;
  try {
    orderId = placeOrder();
  } catch (err) {
    if (discount_code && discountInfo) {
      db.prepare('UPDATE discount_codes SET uses = uses - 1 WHERE UPPER(code) = UPPER(?)').run(discount_code);
    }
    if (err.code === 'OUT_OF_STOCK') return res.status(409).json({ error: err.message });
    throw err;
  }

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
        // MoMo push failed — delete the order and roll back stock + discount
        db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
        const restore = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
        for (const item of cartItems) restore.run(item.quantity, item.product_id);
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
    `/orders/${orderId}`,
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
