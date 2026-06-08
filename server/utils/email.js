const nodemailer = require('nodemailer');

// ── Store identity (env-driven, with Beyond Beauty defaults) ──────────────
const APP_NAME      = process.env.APP_NAME || 'Beyond Beauty Boutique';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Beyond Beauty LTD';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'beautybeyond706@gmail.com';

// Headers that flag a message as high importance across mail clients.
const IMPORTANCE_HEADERS = {
  'Importance': 'high',
  'X-Priority': '1',
  'X-MSMail-Priority': 'High',
};
const STORE_LOCATION = 'Kicukiro, Kigali, Rwanda';
const BRAND_DARK    = '#1A140F';
const BRAND_GOLD    = '#CA8A04';

// Configure transporter from SMTP_* environment variables.
// Real SMTP is used whenever SMTP_HOST is set. If it is not set (local dev
// only), we fall back to jsonTransport, which serialises the message to the
// console and sends nothing.
function getTransporter() {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true }); // local-dev console fallback
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // false → STARTTLS on 587
    auth: {
      user: process.env.SMTP_USER,
      // Gmail App Password (spaces optional; strip them so either form works).
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    },
  });
}

// "From" header: messages are sent under the legal sender name (Beyond Beauty
// LTD) over the configured sending address. SMTP_FROM can override the whole
// header if a fully-formed value is provided.
function fromHeader() {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  return `"${EMAIL_FROM_NAME}" <${process.env.SMTP_USER || SUPPORT_EMAIL}>`;
}

// Shared email chrome so every message stays on-brand.
function emailHeader() {
  return `<div style="background:${BRAND_DARK};padding:24px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:3px;font-family:Georgia,serif;">
          BEYOND <span style="color:${BRAND_GOLD};">BEAUTY</span>
        </h1>
        <p style="color:#b8a98f;font-size:10px;letter-spacing:3px;margin:6px 0 0;text-transform:uppercase;">Fashion | Beauty | Lifestyle</p>
      </div>`;
}

function emailFooter() {
  return `<div style="padding:16px 24px;background:#f9f9f9;text-align:center;font-size:11px;color:#9b9b9b;">
        ${APP_NAME} · ${STORE_LOCATION} · ${SUPPORT_EMAIL}
      </div>`;
}

function formatRWF(amount) {
  return `RWF ${Math.round(amount).toLocaleString('en-US')}`;
}

async function sendOrderConfirmation(user, order) {
  const transporter = getTransporter();
  const items = order.items || [];
  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${i.name} (${i.color}, ${i.size}) ×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${formatRWF(i.price * i.quantity)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      ${emailHeader()}
      <div style="padding:32px 24px;">
        <h2 style="font-weight:400;margin-bottom:4px;">Order Confirmed!</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Hi ${user.name}, thank you for your order.</p>
        <div style="background:#faf8f5;border:1px solid #e5ddd3;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#9b9b9b;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
          <p style="margin:0;font-size:18px;font-weight:700;font-family:monospace;">#${order.id}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${itemRows}
        </table>
        <div style="border-top:2px solid #1a1a1a;padding-top:12px;display:flex;justify-content:space-between;">
          <strong>Total</strong>
          <strong>${formatRWF(order.total)}</strong>
        </div>
        <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-left:4px solid #22c55e;">
          <p style="margin:0;font-size:13px;color:#15803d;">We'll contact you via phone/WhatsApp once your order is ready for delivery.</p>
        </div>
      </div>
      ${emailFooter()}
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromHeader(),
      to: user.email,
      subject: `Order Confirmed — #${order.id} | ${APP_NAME}`,
      html,
      priority: 'high',
      headers: IMPORTANCE_HEADERS,
    });
    // If using jsonTransport (dev), log to console
    if (info.message) console.log('[EMAIL DEV]', JSON.parse(info.message).subject, '→', user.email);
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
  }
}

async function sendStatusUpdate(user, order) {
  const transporter = getTransporter();
  const STATUS_MSG = {
    processing: 'We are processing your order.',
    shipped: 'Great news! Your order is on its way.',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };
  const msg = STATUS_MSG[order.status] || `Your order status has been updated to: ${order.status}`;

  try {
    const info = await transporter.sendMail({
      from: fromHeader(),
      to: user.email,
      subject: `Order #${order.id} — ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} | ${APP_NAME}`,
      priority: 'high',
      headers: IMPORTANCE_HEADERS,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;">
          ${emailHeader()}
          <div style="padding:32px 24px;">
            <h2 style="font-weight:400;">Order Update</h2>
            <p>Hi ${user.name},</p>
            <p>${msg}</p>
            <p style="margin-top:20px;">Order <strong>#${order.id}</strong> — <strong>${formatRWF(order.total)}</strong></p>
          </div>
          ${emailFooter()}
        </div>
      `,
    });
    if (info.message) console.log('[EMAIL DEV]', JSON.parse(info.message).subject, '→', user.email);
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
  }
}

module.exports = { sendOrderConfirmation, sendStatusUpdate, fromHeader, IMPORTANCE_HEADERS, APP_NAME };
