/**
 * MTN Mobile Money Collections API
 * Docs: https://momodeveloper.mtn.com/api-documentation/collection/
 *
 * Required env vars:
 *   MOMO_BASE_URL            — https://sandbox.momodeveloper.mtn.com  (sandbox)
 *                              or https://proxy.momoapi.mtn.com         (production)
 *   MOMO_SUBSCRIPTION_KEY    — Collections Primary Key from developer portal
 *   MOMO_API_USER_ID         — UUID created via POST /v1_0/apiuser
 *   MOMO_API_KEY             — Key from POST /v1_0/apiuser/{userId}/apikey
 *   MOMO_TARGET_ENVIRONMENT  — "sandbox" | "mtnrwanda"
 *   MOMO_CURRENCY            — "EUR" (sandbox) | "RWF" (production)
 */

const { randomUUID } = require('crypto');

const BASE_URL     = process.env.MOMO_BASE_URL           || 'https://sandbox.momodeveloper.mtn.com';
const SUB_KEY      = process.env.MOMO_SUBSCRIPTION_KEY;
const API_USER     = process.env.MOMO_API_USER_ID;
const API_KEY      = process.env.MOMO_API_KEY;
const TARGET_ENV   = process.env.MOMO_TARGET_ENVIRONMENT  || 'sandbox';
const CURRENCY     = process.env.MOMO_CURRENCY            || 'EUR';

// A value counts as "set" only if it's non-empty and not a leftover placeholder.
function isRealValue(v) {
  if (!v) return false;
  const s = String(v).trim();
  if (!s) return false;
  return !/^(paste|your|<|changeme)/i.test(s);
}

function isConfigured() {
  return isRealValue(SUB_KEY) && isRealValue(API_USER) && isRealValue(API_KEY);
}

/** Normalize Rwanda phone → MSISDN (e.g. 078 000 0000 → 250780000000) */
function toMsisdn(phone) {
  let p = phone.replace(/[\s\-\(\)]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '250' + p.slice(1);
  if (!p.startsWith('250')) p = '250' + p;
  return p;
}

async function getAccessToken() {
  const credentials = Buffer.from(`${API_USER}:${API_KEY}`).toString('base64');
  const res = await fetch(`${BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MoMo token error (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * Send a Request-to-Pay to the customer's phone.
 * Returns the referenceId (UUID) you can use to check status later.
 */
async function requestToPay({ phone, amount, orderId, description }) {
  if (!isConfigured()) {
    throw new Error('MTN MoMo API credentials are not configured on the server.');
  }

  const token = await getAccessToken();
  const referenceId = randomUUID();
  const msisdn = toMsisdn(phone);

  const body = {
    amount: String(Math.round(amount)),
    currency: CURRENCY,
    externalId: String(orderId),
    payer: { partyIdType: 'MSISDN', partyId: msisdn },
    payerMessage: description || 'M·Shop Payment',
    payeeNote: `Order #${orderId}`,
  };

  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': TARGET_ENV,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status !== 202) {
    const errBody = await res.text();
    throw new Error(`MoMo requesttopay failed (${res.status}): ${errBody}`);
  }

  return referenceId;
}

/**
 * Poll the status of a Request-to-Pay.
 * Returns: { status: 'PENDING' | 'SUCCESSFUL' | 'FAILED', reason?: string }
 */
async function getPaymentStatus(referenceId) {
  if (!isConfigured()) {
    throw new Error('MTN MoMo API credentials are not configured.');
  }

  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': TARGET_ENV,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MoMo status check failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  // data.status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  return { status: data.status, reason: data.reason };
}

module.exports = { requestToPay, getPaymentStatus, isConfigured, toMsisdn };
