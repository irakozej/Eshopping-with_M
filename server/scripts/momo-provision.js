#!/usr/bin/env node
/**
 * MTN MoMo SANDBOX provisioning.
 *
 * In sandbox you only get ONE value from the portal: the Collections
 * Subscription Key. The API User + API Key must be created programmatically
 * via two sandbox-only endpoints. This script does that for you.
 *
 * Usage:
 *   node scripts/momo-provision.js <SUBSCRIPTION_KEY>
 *   (or set MOMO_SUBSCRIPTION_KEY in .env and run with no args)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { randomUUID } = require('crypto');

const BASE_URL = process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const SUB_KEY = process.argv[2] || process.env.MOMO_SUBSCRIPTION_KEY;

if (!SUB_KEY || SUB_KEY.includes('PASTE') || SUB_KEY.includes('your')) {
  console.error('\n✗ No subscription key provided.');
  console.error('  Usage: npm run momo:provision -- <your-collections-primary-key>');
  console.error('  Get it at https://momodeveloper.mtn.com → Profile → your Collections subscription.\n');
  process.exit(1);
}

if (!BASE_URL.includes('sandbox')) {
  console.error('\n✗ This provisioning flow only works against the SANDBOX base URL.');
  console.error(`  Current MOMO_BASE_URL = ${BASE_URL}`);
  console.error('  Set MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com and retry.\n');
  process.exit(1);
}

async function main() {
  const apiUserId = randomUUID(); // we choose this UUID; it becomes the API User ID
  console.log('─── MoMo sandbox provisioning ──────────────────────────');
  console.log(`  Base URL:    ${BASE_URL}`);
  console.log(`  Sub key:     ${SUB_KEY.slice(0, 8)}…`);
  console.log(`  New API User: ${apiUserId}`);
  console.log('────────────────────────────────────────────────────────\n');

  // 1. Create the API user
  process.stdout.write('• Creating API user... ');
  let res = await fetch(`${BASE_URL}/v1_0/apiuser`, {
    method: 'POST',
    headers: {
      'X-Reference-Id': apiUserId,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ providerCallbackHost: 'localhost' }),
  });
  if (res.status !== 201) {
    console.log('FAILED');
    console.error(`  (${res.status}) ${await res.text()}`);
    if (res.status === 401) console.error('  → Subscription key is wrong or not for the Collections product.');
    process.exit(1);
  }
  console.log('OK (201)');

  // 2. Generate an API key for that user
  process.stdout.write('• Generating API key... ');
  res = await fetch(`${BASE_URL}/v1_0/apiuser/${apiUserId}/apikey`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': SUB_KEY },
  });
  if (res.status !== 201) {
    console.log('FAILED');
    console.error(`  (${res.status}) ${await res.text()}`);
    process.exit(1);
  }
  const { apiKey } = await res.json();
  console.log('OK (201)');

  // 3. Sanity check: the user is now retrievable
  process.stdout.write('• Verifying API user... ');
  res = await fetch(`${BASE_URL}/v1_0/apiuser/${apiUserId}`, {
    headers: { 'Ocp-Apim-Subscription-Key': SUB_KEY },
  });
  console.log(res.ok ? 'OK' : `WARN (${res.status})`);

  console.log('\n✓ Provisioned! Paste these into server/.env:\n');
  console.log('  MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com');
  console.log(`  MOMO_SUBSCRIPTION_KEY=${SUB_KEY}`);
  console.log(`  MOMO_API_USER_ID=${apiUserId}`);
  console.log(`  MOMO_API_KEY=${apiKey}`);
  console.log('  MOMO_TARGET_ENVIRONMENT=sandbox');
  console.log('  MOMO_CURRENCY=EUR\n');
  console.log('  Then run:  npm run test:momo\n');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message, '\n');
  process.exit(1);
});
