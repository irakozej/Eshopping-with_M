#!/usr/bin/env node
// Usage: node scripts/test-stripe.js [amount-in-rwf]
// Creates a PaymentIntent against Stripe TEST mode to prove your secret key works.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const amount = Number(process.argv[2] || 54000);
const key = process.env.STRIPE_SECRET_KEY;

console.log('─── Stripe config ──────────────────────────────────────');
console.log(`  Secret key: ${key ? key.slice(0, 11) + '…' : '(unset)'}`);
console.log(`  Mode:       ${key?.startsWith('sk_test_') ? 'TEST' : key?.startsWith('sk_live_') ? 'LIVE ⚠️' : 'UNKNOWN'}`);
console.log(`  Amount:     RWF ${amount.toLocaleString()}`);
console.log('────────────────────────────────────────────────────────\n');

if (!key || key.includes('placeholder') || key === 'sk_test_your_stripe_key') {
  console.error('✗ STRIPE_SECRET_KEY is not set (or is still the placeholder).');
  console.error('  Get one at https://dashboard.stripe.com/test/apikeys and paste it into server/.env.\n');
  process.exit(1);
}

const stripe = require('stripe')(key);

(async () => {
  try {
    process.stdout.write('• Creating PaymentIntent... ');
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'rwf',
      automatic_payment_methods: { enabled: true },
      description: 'M·Shop test intent',
    });
    console.log('OK');
    console.log(`\n  Intent ID: ${intent.id}`);
    console.log(`  Status:    ${intent.status}`);
    console.log(`  Client secret: ${intent.client_secret.slice(0, 30)}…`);
    console.log(`\n✓ Your key works. View it in the dashboard:`);
    console.log(`  https://dashboard.stripe.com/test/payments/${intent.id}\n`);
  } catch (err) {
    console.log('FAILED');
    console.error(`\n  ${err.type || 'Error'}: ${err.message}`);
    if (err.code === 'authentication_required' || err.statusCode === 401) {
      console.error('\n  → The key is invalid or revoked. Re-copy from the dashboard.');
    }
    if (err.code === 'amount_too_small' || /currency/i.test(err.message)) {
      console.error('\n  → Your Stripe account may not have RWF enabled. Check Settings → Payment methods.');
    }
    console.error();
    process.exit(1);
  }
})();
