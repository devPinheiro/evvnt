#!/usr/bin/env node
/**
 * Wait until PostgreSQL accepts TCP connections on the host/port from `.env` → `DATABASE_URL`
 * (defaults: 127.0.0.1:5432). Use after `brew services start postgresql@16` or equivalent.
 */
import { config } from 'dotenv';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
if (!fs.existsSync(envPath)) {
  console.error('[db:wait] Missing .env. Copy from .env.example');
  process.exit(1);
}
config({ path: envPath });

let host = process.env.PGHOST || '127.0.0.1';
let port = Number(process.env.PGPORT || 5432);

const url = process.env.DATABASE_URL?.trim();
if (url) {
  try {
    const u = new URL(url);
    if (u.hostname) host = u.hostname;
    if (u.port) port = Number(u.port);
  } catch {
    console.error('[db:wait] Could not parse DATABASE_URL in .env');
    process.exit(1);
  }
}

const maxAttempts = 80;

function tryOnce() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve();
    });
    socket.on('error', reject);
  });
}

for (let i = 0; i < maxAttempts; i++) {
  try {
    await tryOnce();
    console.log(`[db:wait] Postgres is accepting connections on ${host}:${port}.`);
    process.exit(0);
  } catch {
    await delay(250);
  }
}

console.error(
  `[db:wait] Timed out waiting for ${host}:${port}. Start PostgreSQL locally and ensure DATABASE_URL matches.`,
);
process.exit(1);
