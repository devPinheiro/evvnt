import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: 'SMTP_NOT_CONFIGURED' }
  | { sent: false; reason: 'SMTP_SEND_FAILED'; message: string };

/**
 * Sends mail via SMTP (tested with Mailgun: smtp.mailgun.org / smtp.eu.mailgun.org).
 * Uses STARTTLS on 587 and 2525; SSL on 465.
 */
export async function sendEmail(msg: EmailMessage): Promise<SendEmailResult> {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  // Mailgun (and most providers) default to 587 STARTTLS; omitting SMTP_PORT must not block send.
  const port = env.SMTP_PORT ?? 587;
  const secure = port === 465;
  const useStartTls = !secure && (port === 587 || port === 2525);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: useStartTls,
    auth: { user, pass },
    tls: {
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
  });

  try {
    await transporter.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: 'SMTP_SEND_FAILED', message };
  }
}
