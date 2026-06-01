#!/usr/bin/env node
/**
 * End-to-end MTN MoMo sandbox test: request-to-pay → poll until resolved.
 *
 * Usage:
 *   npm run test:momo                 # uses default sandbox payer number
 *   npm run test:momo -- 46733123450  # custom payer MSISDN
 *
 * Sandbox note: the payer number is auto-approved by MTN's sandbox, so the
 * status transitions PENDING → SUCCESSFUL within a few seconds without any
 * real phone interaction.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const momo = require('../utils/momo');

const payer = process.argv[2] || '0780000000';
const amount = 5; // EUR in sandbox

async function main() {
  console.log('─── MoMo end-to-end test ───────────────────────────────');
  console.log(`  Configured: ${momo.isConfigured()}`);
  console.log(`  Payer:      ${payer}  →  MSISDN ${momo.toMsisdn(payer)}`);
  console.log(`  Amount:     ${amount} ${process.env.MOMO_CURRENCY || 'EUR'}`);
  console.log('────────────────────────────────────────────────────────\n');

  if (!momo.isConfigured()) {
    console.log('· Credentials absent — isConfigured() === false.');
    console.log('  This is the graceful fallback path: the checkout creates the order');
    console.log('  in demo mode and never calls the MoMo API. Nothing to test live.\n');
    console.log('  To run a real sandbox test, provision keys first:');
    console.log('    npm run momo:provision -- <subscription-key>\n');
    return;
  }

  process.stdout.write('• Sending request-to-pay... ');
  const referenceId = await momo.requestToPay({
    phone: payer,
    amount,
    orderId: `TEST-${Date.now().toString().slice(-6)}`,
    description: 'M·Shop sandbox test',
  });
  console.log('accepted (202)');
  console.log(`  Reference ID: ${referenceId}\n`);

  process.stdout.write('• Polling status');
  let status = 'PENDING';
  let reason = null;
  for (let i = 0; i < 15 && status === 'PENDING'; i++) {
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write('.');
    ({ status, reason } = await momo.getPaymentStatus(referenceId));
  }
  console.log('');

  const icon = status === 'SUCCESSFUL' ? '✓' : status === 'FAILED' ? '✗' : '…';
  console.log(`\n${icon} Final status: ${status}${reason ? ` (reason: ${reason})` : ''}`);

  if (status === 'SUCCESSFUL') {
    console.log('  The polling loop resolved correctly — this is exactly what');
    console.log('  /api/payments/momo-status/:referenceId returns to the frontend,');
    console.log('  which then flips the order from pending_payment → processing.\n');
  } else if (status === 'PENDING') {
    console.log('  Still pending after 30s. Sandbox is usually faster; try again.\n');
    process.exit(1);
  } else {
    console.log('  The sandbox returned a non-success terminal status (expected for');
    console.log('  certain test numbers). The FAILED branch in the UI handles this.\n');
  }
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message, '\n');
  process.exit(1);
});
