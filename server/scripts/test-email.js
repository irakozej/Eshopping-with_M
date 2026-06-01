#!/usr/bin/env node
// Usage: node scripts/test-email.js you@example.com
// Sends a sample order-confirmation email using the current .env config.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');
const { sendOrderConfirmation } = require('../utils/email');

const recipient = process.argv[2] || process.env.TEST_EMAIL_TO;
if (!recipient) {
  console.error('\nUsage: npm run test:email -- you@example.com\n');
  process.exit(1);
}

const configured = !!process.env.SMTP_HOST;
console.log('─── Email config ───────────────────────────────────────');
console.log(`  Mode:      ${configured ? 'REAL SMTP' : 'CONSOLE FALLBACK (jsonTransport)'}`);
if (configured) {
  console.log(`  Host:      ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
  console.log(`  Secure:    ${process.env.SMTP_SECURE === 'true'}`);
  console.log(`  User:      ${process.env.SMTP_USER || '(unset)'}`);
  console.log(`  From:      ${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mshop.rw'}`);
  console.log(`  Password:  ${process.env.SMTP_PASS ? `set (${process.env.SMTP_PASS.replace(/\s/g, '').length} chars)` : '(unset)'}`);
}
console.log(`  Recipient: ${recipient}`);
console.log('────────────────────────────────────────────────────────\n');

async function main() {
  if (configured) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    process.stdout.write('• Verifying SMTP connection... ');
    try {
      await transporter.verify();
      console.log('OK');
    } catch (err) {
      console.log('FAILED');
      console.error(`\n  ${err.message}\n`);
      console.error('  Common Gmail fixes:');
      console.error('   - Did you enable 2-Step Verification?');
      console.error('   - Are you using an App Password (not your Gmail login)?');
      console.error('   - Does SMTP_USER match the account that generated the App Password?\n');
      process.exit(1);
    }
  }

  const fakeUser = { name: 'Test Customer', email: recipient };
  const fakeOrder = {
    id: `TEST-${Date.now().toString().slice(-6)}`,
    total: 54000,
    items: [
      { name: 'Classic White Linen Shirt', color: 'White', size: 'M', quantity: 1, price: 35000 },
      { name: 'Stone Cotton Trousers',     color: 'Stone', size: '32', quantity: 1, price: 19000 },
    ],
  };

  process.stdout.write(`• Sending order-confirmation email to ${recipient}... `);
  await sendOrderConfirmation(fakeUser, fakeOrder);
  console.log('done');

  if (configured) {
    console.log(`\n✓ Sent. Check ${recipient}'s inbox (and spam folder).`);
    console.log(`  Subject: "Order Confirmed — #${fakeOrder.id} | M·Shop"\n`);
  } else {
    console.log('\n· No SMTP_HOST set — nothing actually sent. Add Gmail creds to server/.env to deliver for real.\n');
  }
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message, '\n');
  process.exit(1);
});
