import { injectable } from 'inversify';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { sendEmail } from './email.sender.js';

@injectable()
export class NotificationsService {
  async notifyInApp(input: {
    organisationId: string;
    userId: string;
    title: string;
    body?: string | null;
    data?: unknown;
  }) {
    return prisma.notification.create({
      data: {
        organisationId: input.organisationId,
        userId: input.userId,
        channel: NotificationChannel.IN_APP,
        title: input.title,
        body: input.body ?? null,
        data: (input.data as any) ?? undefined,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  async notifyEmail(input: {
    organisationId: string;
    userId: string;
    toEmail: string;
    subject: string;
    text: string;
    data?: unknown;
  }) {
    const notif = await prisma.notification.create({
      data: {
        organisationId: input.organisationId,
        userId: input.userId,
        channel: NotificationChannel.EMAIL,
        title: input.subject,
        body: input.text,
        data: { ...(input.data as any), toEmail: input.toEmail } as any,
        status: NotificationStatus.PENDING,
      },
    });

    const result = await sendEmail({ to: input.toEmail, subject: input.subject, text: input.text });

    if (!result.sent) {
      const error =
        result.reason === 'SMTP_SEND_FAILED'
          ? `SMTP_SEND_FAILED: ${result.message}`
          : result.reason;
      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: NotificationStatus.FAILED, error },
      });
      return { notification: notif, delivered: false as const, reason: error };
    }

    const updated = await prisma.notification.update({
      where: { id: notif.id },
      data: { status: NotificationStatus.SENT, sentAt: new Date(), error: null },
    });

    return { notification: updated, delivered: true as const };
  }
}

