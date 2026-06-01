const nodemailer = require('nodemailer');

// Configure transporter from environment variables.
// For development, emails are logged to console if SMTP_HOST is not set.
function getTransporter() {
  if (!process.env.SMTP_HOST) {
    // Ethereal / console fallback for dev
    return nodemailer.createTransport({
      jsonTransport: true, // logs to console only
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
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
      <div style="background:#1A140F;padding:24px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:3px;">M·<span style="color:#C8873A;">SHOP</span></h1>
      </div>
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
      <div style="padding:16px 24px;background:#f9f9f9;text-align:center;font-size:11px;color:#9b9b9b;">
        M·Shop Rwanda · KG 11 Ave, Kigali · hello@mshop.rw
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"M·Shop" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mshop.rw'}>`,
      to: user.email,
      subject: `Order Confirmed — #${order.id} | M·Shop`,
      html,
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
      from: `"M·Shop" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mshop.rw'}>`,
      to: user.email,
      subject: `Order #${order.id} — ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} | M·Shop`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#1A140F;padding:24px;text-align:center;">
            <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:3px;">M·<span style="color:#C8873A;">SHOP</span></h1>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="font-weight:400;">Order Update</h2>
            <p>Hi ${user.name},</p>
            <p>${msg}</p>
            <p style="margin-top:20px;">Order <strong>#${order.id}</strong> — <strong>${formatRWF(order.total)}</strong></p>
          </div>
        </div>
      `,
    });
    if (info.message) console.log('[EMAIL DEV]', JSON.parse(info.message).subject, '→', user.email);
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
  }
}

module.exports = { sendOrderConfirmation, sendStatusUpdate };
