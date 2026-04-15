import { injectable } from 'inversify';
import { nanoid } from 'nanoid';
import { GiftStatus } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../http/errors.js';

@injectable()
export class GiftsService {
  async upsertSettings(input: {
    orgId: string;
    eventId: string;
    isEnabled: boolean;
    hostDisplayName?: string | null;
    hostPhotoUrl?: string | null;
    pageMessage?: string | null;
    suggestedAmounts?: number[] | null;
  }) {
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, organisationId: input.orgId },
      select: { id: true },
    });
    if (!event) throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });

    return prisma.giftSettings.upsert({
      where: { eventId: input.eventId },
      update: {
        isEnabled: input.isEnabled,
        hostDisplayName: input.hostDisplayName ?? null,
        hostPhotoUrl: input.hostPhotoUrl ?? null,
        pageMessage: input.pageMessage ?? null,
        suggestedAmounts: input.suggestedAmounts ?? [],
      },
      create: {
        eventId: input.eventId,
        isEnabled: input.isEnabled,
        hostDisplayName: input.hostDisplayName ?? null,
        hostPhotoUrl: input.hostPhotoUrl ?? null,
        pageMessage: input.pageMessage ?? null,
        suggestedAmounts: input.suggestedAmounts ?? [],
      },
    });
  }

  async createGiftCheckout(input: {
    eventId: string;
    amountNgn: number;
    senderName?: string | null;
    senderEmail?: string | null;
    senderPhone?: string | null;
    isAnonymous?: boolean | null;
    message?: string | null;
  }) {
    const settings = await prisma.giftSettings.findUnique({ where: { eventId: input.eventId } });
    if (!settings?.isEnabled) {
      throw new AppError({ status: 409, code: 'GIFTING_DISABLED', message: 'Gifting is not enabled for this event' });
    }
    if (input.amountNgn < 500) {
      throw new AppError({ status: 400, code: 'BAD_REQUEST', message: 'Minimum gift is ₦500' });
    }

    const paystackRef = `evvnt_gift_${nanoid(18)}`;
    const gift = await prisma.gift.create({
      data: {
        eventId: input.eventId,
        amountNgn: input.amountNgn,
        senderName: input.senderName ?? null,
        senderEmail: input.senderEmail?.trim().toLowerCase() ?? null,
        senderPhone: input.senderPhone?.trim() ?? null,
        isAnonymous: input.isAnonymous ?? false,
        message: input.message ?? null,
        status: GiftStatus.INITIATED,
        paystackRef,
      },
    });

    return {
      gift,
      paystack: {
        reference: paystackRef,
        amountNgn: gift.amountNgn,
        amountKobo: gift.amountNgn * 100,
        email: gift.senderEmail,
      },
    };
  }

  async listGifts(orgId: string, eventId: string) {
    return prisma.gift.findMany({
      where: { eventId, event: { organisationId: orgId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestPayout(orgId: string, eventId: string, amountNgn: number) {
    if (amountNgn < 1000) {
      throw new AppError({ status: 400, code: 'BAD_REQUEST', message: 'Minimum payout is ₦1,000' });
    }
    const event = await prisma.event.findFirst({
      where: { id: eventId, organisationId: orgId },
      select: { id: true },
    });
    if (!event) throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });

    return prisma.giftPayout.create({
      data: { eventId, amountNgn, status: 'REQUESTED' },
    });
  }
}

