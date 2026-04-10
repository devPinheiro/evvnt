import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(msg: EmailMessage) {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.EMAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    // In dev, allow running without SMTP configured.
    return { sent: false as const, reason: 'SMTP_NOT_CONFIGURED' as const };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
  });

  return { sent: true as const };
}

