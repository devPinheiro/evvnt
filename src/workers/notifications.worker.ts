import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import { prisma } from '../lib/prisma.js';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { sendEmail } from '../modules/notifications/email.sender.js';

const POLL_MS = 10_000;
const MAX_RETRIES = 5;

function backoffMs(retryCount: number) {
  // 1m, 2m, 4m, 8m, 16m (cap)
  return Math.min(60_000 * 2 ** retryCount, 60_000 * 60);
}

async function tick() {
  const now = new Date();

  const batch = await prisma.notification.findMany({
    where: {
      channel: NotificationChannel.EMAIL,
      status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] },
      retryCount: { lt: MAX_RETRIES },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  for (const n of batch) {
    // Claim by bumping lastAttemptAt and moving status to PENDING (best-effort lock)
    const claimed = await prisma.notification.updateMany({
      where: {
        id: n.id,
        status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] },
        retryCount: n.retryCount,
      },
      data: {
        status: NotificationStatus.PENDING,
        lastAttemptAt: now,
      },
    });

    if (claimed.count !== 1) continue;

    // For now, Notification.body is the email text and title is the subject.
    // We don't store recipient email on Notification, so email retries are only meaningful
    // for notifications that include recipient in data.
    const toEmail = (n.data as any)?.toEmail as string | undefined;
    if (!toEmail) {
      await prisma.notification.update({
        where: { id: n.id },
        data: {
          status: NotificationStatus.FAILED,
          error: 'MISSING_TO_EMAIL',
          retryCount: n.retryCount + 1,
          nextAttemptAt: new Date(Date.now() + backoffMs(n.retryCount)),
        },
      });
      continue;
    }

    const result = await sendEmail({ to: toEmail, subject: n.title, text: n.body ?? '' });
    if (result.sent) {
      await prisma.notification.update({
        where: { id: n.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date(), error: null, nextAttemptAt: null },
      });
    } else {
      const error =
        result.reason === 'SMTP_SEND_FAILED'
          ? `SMTP_SEND_FAILED: ${result.message}`
          : result.reason;
      await prisma.notification.update({
        where: { id: n.id },
        data: {
          status: NotificationStatus.FAILED,
          error,
          retryCount: n.retryCount + 1,
          nextAttemptAt: new Date(Date.now() + backoffMs(n.retryCount)),
        },
      });
    }
  }
}

async function main() {
  console.log('[notifications.worker] started');
  console.log(`[notifications.worker] polling every ${POLL_MS}ms, maxRetries=${MAX_RETRIES}`);

  while (true) {
    try {
      await tick();
    } catch (err) {
      console.error('[notifications.worker] tick error', err);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch(async (err) => {
  console.error('[notifications.worker] fatal', err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});

