import 'reflect-metadata';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import { afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

loadEnv({ path: path.join(root, '.env') });
loadEnv({ path: path.join(root, '.env.test'), override: true });

process.env.NODE_ENV = 'test';
if (!process.env.PAYSTACK_SECRET_KEY?.trim()) {
  process.env.PAYSTACK_SECRET_KEY = 'test-paystack-secret-key-32chars!!';
}

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error(
    'E2E tests require DATABASE_URL. Set it in .env or .env.test (see .env.test.example).',
  );
}

afterAll(async () => {
  await prisma.$disconnect();
});
