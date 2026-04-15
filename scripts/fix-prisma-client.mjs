import fs from 'node:fs';
import path from 'node:path';

// Cursor/TS tooling expects @prisma/client to expose `.prisma/client/*` types.
// Prisma generates the client into `node_modules/.prisma/client` and @prisma/client re-exports it via a
// relative path `.prisma/client/...` from inside `node_modules/@prisma/client`.
// On some installs, `node_modules/@prisma/client/.prisma` may not exist, which breaks type resolution.

const backendDir = process.cwd();
const prismaCacheDir = path.join(backendDir, 'node_modules', '.prisma');
const prismaClientDir = path.join(backendDir, 'node_modules', '@prisma', 'client');
const linkTargetRelative = path.relative(prismaClientDir, prismaCacheDir); // should be ../../.prisma
const linkPath = path.join(prismaClientDir, '.prisma');

try {
  if (!fs.existsSync(prismaCacheDir)) process.exit(0);
  if (!fs.existsSync(prismaClientDir)) process.exit(0);

  // If already present (dir or link), do nothing.
  if (fs.existsSync(linkPath)) process.exit(0);

  fs.symlinkSync(linkTargetRelative, linkPath, 'junction');
} catch {
  // Best-effort; install should not fail because of this.
  process.exit(0);
}

