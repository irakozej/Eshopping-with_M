#!/usr/bin/env node
/**
 * seed-admin.js — create the boutique's single launch admin, idempotently.
 *
 *   node scripts/seed-admin.js        (or: npm run seed:admin)
 *
 * Behaviour:
 *   - If no user with the admin email exists, it is created with role "admin"
 *     and a RANDOM secure temporary password, which is printed to the console
 *     ONCE. The password is never stored in plaintext or committed — only its
 *     bcrypt hash is saved.
 *   - If the user already exists, nothing is changed (no duplicate, no
 *     overwrite of name / role / password). Safe to run repeatedly.
 *
 * This is the only admin at launch (Beyond Beauty Boutique).
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db/setup');

const ADMIN_NAME = 'Night Esther Kaliza';
const ADMIN_EMAIL = 'kalizane44@gmail.com'; // stored lowercase to match login lookup
const ADMIN_ROLE = 'admin';

/** Generate a strong, readable temporary password (no ambiguous characters). */
function generateTempPassword(length = 18) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*?';
  const bytes = crypto.randomBytes(length);
  let pwd = '';
  for (let i = 0; i < length; i++) pwd += alphabet[bytes[i] % alphabet.length];
  return pwd;
}

function main() {
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email);

  if (existing) {
    console.log(`✓ Admin already exists — no changes made.`);
    console.log(`  ${existing.name} <${existing.email}> (role: ${existing.role}, id: ${existing.id})`);
    console.log('  Re-running this script never duplicates or overwrites the user.');
    return;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = bcrypt.hashSync(tempPassword, 10);

  const info = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(ADMIN_NAME, email, passwordHash, ADMIN_ROLE);

  console.log('✓ Created launch admin user:');
  console.log(`  Name:  ${ADMIN_NAME}`);
  console.log(`  Email: ${email}`);
  console.log(`  Role:  ${ADMIN_ROLE} (id: ${info.lastInsertRowid})`);
  console.log('');
  console.log('  ┌──────────────────────────────────────────────────────────┐');
  console.log('  │  TEMPORARY PASSWORD (shown ONCE — copy it now):           │');
  console.log(`  │     ${tempPassword.padEnd(54)}│`);
  console.log('  └──────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('  ⚠  Store it in a password manager and change it after first login.');
  console.log('     It is not saved anywhere in plaintext and cannot be recovered.');
}

main();
