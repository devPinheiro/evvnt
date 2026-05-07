import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
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

export type SmtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'SMTP_NOT_CONFIGURED' }
  | { ok: false; reason: 'SMTP_VERIFY_FAILED'; message: string };

/**
 * Builds an SMTP transporter when `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` are set.
 * Uses STARTTLS on 587 and 2525; SSL on 465.
 */
export function createConfiguredSmtpTransport(): Transporter | null {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    return null;
  }

  const port = env.SMTP_PORT ?? 587;
  const secure = port === 465;
  const useStartTls = !secure && (port === 587 || port === 2525);

  return nodemailer.createTransport({
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
}

/** SMTP handshake only — does not send a message. */
export async function verifySmtpConnection(): Promise<SmtpVerifyResult> {
  const transporter = createConfiguredSmtpTransport();
  if (!transporter) {
    return { ok: false, reason: 'SMTP_NOT_CONFIGURED' };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: 'SMTP_VERIFY_FAILED', message };
  }
}

/**
 * Sends mail via SMTP (tested with Mailgun: smtp.mailgun.org / smtp.eu.mailgun.org).
 */
export async function sendEmail(msg: EmailMessage): Promise<SendEmailResult> {
  const transporter = createConfiguredSmtpTransport();
  const from = env.EMAIL_FROM;

  if (!transporter || !from) {
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

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
