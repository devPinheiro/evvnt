import { sendEmail } from '../notifications/email.sender.js';
import { env } from '../../config/env.js';

function baseUrl() {
  return (env.APP_PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

export async function sendVerificationEmail(input: { to: string; token: string; otpCode: string }) {
  const verifyUrl = `${baseUrl()}/api/v1/auth/verify-email?token=${encodeURIComponent(input.token)}`;
  return sendEmail({
    to: input.to,
    subject: 'Verify your Evvnt email',
    text: [
      'Welcome to Evvnt.',
      '',
      `Open this link to verify your email (valid 24 hours):`,
      verifyUrl,
      '',
      `Or enter this code in the app: ${input.otpCode}`,
      '',
      'If you did not create an account, you can ignore this message.',
    ].join('\n'),
  });
}

export async function sendEmailChangeVerification(input: { to: string; token: string }) {
  const verifyUrl = `${baseUrl()}/api/v1/auth/verify-email?token=${encodeURIComponent(input.token)}`;
  return sendEmail({
    to: input.to,
    subject: 'Confirm your new email for Evvnt',
    text: [
      'You requested to change the email on your Evvnt account.',
      '',
      `Confirm by opening: ${verifyUrl}`,
      '',
      'If you did not request this, you can ignore this message.',
    ].join('\n'),
  });
}

export async function sendPasswordResetEmail(input: { to: string; token: string }) {
  const resetUrl = `${baseUrl()}/api/v1/auth/password/reset?token=${encodeURIComponent(input.token)}`;
  return sendEmail({
    to: input.to,
    subject: 'Reset your Evvnt password',
    text: [
      'We received a request to reset your Evvnt password.',
      '',
      `Use this link (valid 1 hour): ${resetUrl}`,
      '',
      'If you did not request a reset, you can ignore this message.',
    ].join('\n'),
  });
}

export async function sendLoginOtpEmail(input: { to: string; code: string }) {
  return sendEmail({
    to: input.to,
    subject: 'Your Evvnt sign-in code',
    text: [
      'Use this one-time code to sign in:',
      '',
      input.code,
      '',
      'It expires in 15 minutes. If you did not try to sign in, ignore this email.',
    ].join('\n'),
  });
}
