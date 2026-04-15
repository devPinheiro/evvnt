#!/usr/bin/env node
/**
 * Run `prisma migrate deploy` using DATABASE_URL from `.env` (dev) or `.env.test` (test).
 * Usage: node scripts/migrate-with-env.mjs [dev|test]
 */
import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mode = (process.argv[2] || 'dev').toLowerCase();
const file = mode === 'test' ? '.env.test' : '.env';
const envPath = path.join(root, file);

if (!fs.existsSync(envPath)) {
  console.error(`Missing ${file}. Copy from ${file === '.env.test' ? '.env.test.example' : '.env.example'}`);
  process.exit(1);
}

config({ path: envPath });
if (!process.env.DATABASE_URL?.trim()) {
  console.error(`${file} must define DATABASE_URL`);
  process.exit(1);
}

console.log(`[migrate] using ${file} → ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: root, env: { ...process.env } });
