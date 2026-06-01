require('dotenv').config();
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });
  console.log('✓ Sentry (backend) initialized');
} else {
  console.log('· Sentry (backend) disabled — set SENTRY_DSN_BACKEND to enable');
}
