import { injectable } from 'inversify';
import { AuthOtpPurpose } from '@prisma/client';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

import { AppError } from '../../http/errors.js';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { hashPassword, verifyPassword } from './password.js';
import { signJwt, verifyJwt } from './jwt.js';
import type { AuthTokenPair } from './auth.types.js';
import { hashOpaqueToken } from './tokenHash.js';
import { generateSixDigitCode, normalizeOtpCode } from './otpCode.js';
import {
  sendEmailChangeVerification,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './auth.mail.js';

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

const VERIFY_MS = 24 * 60 * 60 * 1000;
const RESET_MS = 60 * 60 * 1000;
const OTP_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

@injectable()
export class AuthService {
  async signup(input: { orgName: string; email: string; password: string; name?: string | null }) {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await hashPassword(input.password);

    const org = await prisma.organisation.create({
      data: { name: input.orgName.trim() },
    });

    try {
      const user = await prisma.user.create({
        data: {
          organisationId: org.id,
          email,
          name: input.name ?? null,
          passwordHash,
          emailVerifiedAt: null,
        },
      });

      await this.enqueueEmailVerification(user.id, email, null);

      const tokens = await this.issueTokens({ userId: user.id, orgId: org.id });
      return { organisation: org, user, tokens };
    } catch (e) {
      await prisma.organisation.delete({ where: { id: org.id } }).catch(() => undefined);
      throw e;
    }
  }

  async login(input: { orgId: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { organisationId: input.orgId, email },
    });

    if (!user || !user.passwordHash) {
      throw new AppError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw new AppError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    if (!user.emailVerifiedAt) {
      throw new AppError({
        status: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verify your email before signing in.',
      });
    }

    const tokens = await this.issueTokens({ userId: user.id, orgId: user.organisationId });
    return { user, tokens };
  }

  async requestLoginOtp(input: { orgId: string; email: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { organisationId: input.orgId, email },
    });
    if (!user || !user.emailVerifiedAt) {
      // Do not reveal whether the account exists
      return { ok: true as const };
    }

    await prisma.authOtp.deleteMany({
      where: { userId: user.id, purpose: AuthOtpPurpose.LOGIN_PASSWORDLESS, consumedAt: null },
    });

    const code = generateSixDigitCode();
    const codeHash = await hashPassword(code);
    await prisma.authOtp.create({
      data: {
        userId: user.id,
        purpose: AuthOtpPurpose.LOGIN_PASSWORDLESS,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_MS),
      },
    });

    await sendLoginOtpEmail({ to: user.email, code });
    return { ok: true as const };
  }

  async verifyLoginOtp(input: { orgId: string; email: string; code: string }) {
    const email = input.email.trim().toLowerCase();
    const code = normalizeOtpCode(input.code);
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new AppError({ status: 400, code: 'INVALID_CODE', message: 'Invalid code' });
    }

    const user = await prisma.user.findFirst({
      where: { organisationId: input.orgId, email },
    });
    if (!user || !user.emailVerifiedAt) {
      throw new AppError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const otp = await prisma.authOtp.findFirst({
      where: {
        userId: user.id,
        purpose: AuthOtpPurpose.LOGIN_PASSWORDLESS,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError({ status: 401, code: 'INVALID_CODE', message: 'Invalid or expired code' });
    }

    const match = await verifyPassword(code, otp.codeHash);
    if (!match) {
      await prisma.authOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError({ status: 401, code: 'INVALID_CODE', message: 'Invalid or expired code' });
    }

    await prisma.authOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const tokens = await this.issueTokens({ userId: user.id, orgId: user.organisationId });
    return { user, tokens };
  }

  async verifyEmailWithToken(rawToken: string) {
    const tokenHash = hashOpaqueToken(rawToken.trim());
    const row = await prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!row) {
      throw new AppError({ status: 400, code: 'INVALID_TOKEN', message: 'Invalid or expired verification link' });
    }

    await this.applyEmailVerificationFromTokenRow(row.id, row.userId, row.targetEmail);
    return { ok: true as const };
  }

  async verifyEmailWithOtp(input: { orgId: string; email: string; code: string }) {
    const email = input.email.trim().toLowerCase();
    const code = normalizeOtpCode(input.code);
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new AppError({ status: 400, code: 'INVALID_CODE', message: 'Invalid code' });
    }

    const user = await prisma.user.findFirst({
      where: { organisationId: input.orgId, email },
    });
    if (!user) {
      throw new AppError({ status: 400, code: 'INVALID_CODE', message: 'Invalid or expired code' });
    }

    const otp = await prisma.authOtp.findFirst({
      where: {
        userId: user.id,
        purpose: AuthOtpPurpose.EMAIL_VERIFY,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError({ status: 400, code: 'INVALID_CODE', message: 'Invalid or expired code' });
    }

    const match = await verifyPassword(code, otp.codeHash);
    if (!match) {
      await prisma.authOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError({ status: 400, code: 'INVALID_CODE', message: 'Invalid or expired code' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.authOtp.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
      await tx.emailVerificationToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });

    return { ok: true as const };
  }

  async resendVerification(input: { orgId: string; email: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { organisationId: input.orgId, email },
    });
    if (!user || user.emailVerifiedAt) {
      return { ok: true as const };
    }

    await this.enqueueEmailVerification(user.id, user.email, null);
    return { ok: true as const };
  }

  async requestPasswordReset(input: { orgId: string; email: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { organisationId: input.orgId, email },
    });
    if (!user?.passwordHash) {
      return { ok: true as const };
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, consumedAt: null },
    });

    const raw = nanoid(48);
    const tokenHash = hashOpaqueToken(raw);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_MS),
      },
    });

    await sendPasswordResetEmail({ to: user.email, token: raw });
    return { ok: true as const };
  }

  async resetPassword(input: { token: string; newPassword: string }) {
    if (input.newPassword.length < 8) {
      throw new AppError({ status: 400, code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' });
    }

    const tokenHash = hashOpaqueToken(input.token.trim());
    const row = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!row) {
      throw new AppError({ status: 400, code: 'INVALID_TOKEN', message: 'Invalid or expired reset link' });
    }

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      });
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      });
      await tx.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { ok: true as const };
  }

  async changePassword(input: { userId: string; orgId: string; currentPassword: string; newPassword: string }) {
    if (input.newPassword.length < 8) {
      throw new AppError({ status: 400, code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findFirst({
      where: { id: input.userId, organisationId: input.orgId },
    });
    if (!user?.passwordHash) {
      throw new AppError({ status: 400, code: 'INVALID_CREDENTIALS', message: 'Password login not available for this account' });
    }

    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { ok: true as const };
  }

  async updateProfile(input: {
    userId: string;
    orgId: string;
    name?: string | null;
    email?: string | null;
  }) {
    const user = await prisma.user.findFirst({
      where: { id: input.userId, organisationId: input.orgId },
    });
    if (!user) {
      throw new AppError({ status: 404, code: 'NOT_FOUND', message: 'User not found' });
    }

    let nextName = user.name;
    if (input.name !== undefined) {
      nextName = input.name?.trim() ? input.name.trim() : null;
    }

    if (input.email === undefined || input.email === null) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: nextName },
      });
      return { user: updated };
    }

    const newEmail = input.email.trim().toLowerCase();
    if (newEmail === user.email) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: nextName },
      });
      return { user: updated };
    }

    const clash = await prisma.user.findFirst({
      where: { organisationId: input.orgId, email: newEmail, NOT: { id: user.id } },
    });
    if (clash) {
      throw new AppError({ status: 409, code: 'EMAIL_IN_USE', message: 'That email is already used in this organisation' });
    }

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, consumedAt: null, targetEmail: { not: null } },
    });

    const rawToken = nanoid(40);
    const tokenHash = hashOpaqueToken(rawToken);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        targetEmail: newEmail,
        expiresAt: new Date(Date.now() + VERIFY_MS),
      },
    });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: nextName,
        pendingEmail: newEmail,
      },
    });

    await sendEmailChangeVerification({ to: newEmail, token: rawToken });

    return { user: updated };
  }

  async refresh(input: { refreshToken: string }) {
    const payload = verifyJwt(input.refreshToken);
    if (payload.kind !== 'refresh') {
      throw new AppError({ status: 401, code: 'INVALID_TOKEN', message: 'Invalid refresh token' });
    }

    const tokenHash = sha256(input.refreshToken);
    const existing = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!existing) {
      throw new AppError({ status: 401, code: 'INVALID_TOKEN', message: 'Refresh token revoked or expired' });
    }

    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens({ userId: payload.sub, orgId: payload.orgId });
    return { tokens };
  }

  async logout(input: { refreshToken: string }) {
    const tokenHash = sha256(input.refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private async enqueueEmailVerification(userId: string, email: string, targetEmail: string | null) {
    await prisma.$transaction(async (tx) => {
      if (targetEmail === null) {
        await tx.emailVerificationToken.deleteMany({
          where: { userId, consumedAt: null, targetEmail: null },
        });
      } else {
        await tx.emailVerificationToken.deleteMany({
          where: { userId, consumedAt: null, targetEmail: { not: null } },
        });
      }
      await tx.authOtp.deleteMany({
        where: { userId, purpose: AuthOtpPurpose.EMAIL_VERIFY, consumedAt: null },
      });
    });

    const rawToken = nanoid(40);
    const otp = generateSixDigitCode();
    const tokenHash = hashOpaqueToken(rawToken);
    const otpHash = await hashPassword(otp);

    await prisma.$transaction([
      prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash,
          targetEmail,
          expiresAt: new Date(Date.now() + VERIFY_MS),
        },
      }),
      prisma.authOtp.create({
        data: {
          userId,
          purpose: AuthOtpPurpose.EMAIL_VERIFY,
          codeHash: otpHash,
          expiresAt: new Date(Date.now() + OTP_MS),
        },
      }),
    ]);

    const sendTo = targetEmail ?? email;
    await sendVerificationEmail({ to: sendTo, token: rawToken, otpCode: otp });
  }

  private async applyEmailVerificationFromTokenRow(tokenId: string, userId: string, targetEmail: string | null) {
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: tokenId },
        data: { consumedAt: new Date() },
      });

      if (targetEmail) {
        const next = targetEmail.trim().toLowerCase();
        const user = await tx.user.findFirst({ where: { id: userId } });
        if (!user) throw new AppError({ status: 400, code: 'INVALID_TOKEN', message: 'Invalid token' });

        const clash = await tx.user.findFirst({
          where: { organisationId: user.organisationId, email: next, NOT: { id: userId } },
        });
        if (clash) {
          throw new AppError({ status: 409, code: 'EMAIL_IN_USE', message: 'That email is already used in this organisation' });
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            email: next,
            pendingEmail: null,
            emailVerifiedAt: new Date(),
          },
        });
      } else {
        await tx.user.update({
          where: { id: userId },
          data: { emailVerifiedAt: new Date() },
        });
      }

      await tx.authOtp.updateMany({
        where: { userId, purpose: AuthOtpPurpose.EMAIL_VERIFY, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });
  }

  private async issueTokens(input: { userId: string; orgId: string }): Promise<AuthTokenPair> {
    const accessToken = signJwt('access', { sub: input.userId, orgId: input.orgId });
    const refreshToken = signJwt('refresh', { sub: input.userId, orgId: input.orgId });

    const refreshTokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);

    await prisma.refreshToken.create({
      data: { userId: input.userId, tokenHash: refreshTokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
