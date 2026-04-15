import { inject, injectable } from 'inversify';
import { nanoid } from 'nanoid';
import { TicketOrderStatus } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../http/errors.js';
import { TYPES } from '../../di/types.js';
import { AuditService } from '../audit/audit.service.js';

@injectable()
export class TicketingService {
  constructor(@inject(TYPES.AuditService) private audit: AuditService) {}

  async listTiers(orgId: string, eventId: string) {
    return prisma.ticketTier.findMany({
      where: { eventId, event: { organisationId: orgId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTier(input: {
    orgId: string;
    actorUserId: string;
    eventId: string;
    name: string;
    description?: string | null;
    priceNgn: number;
    quantityTotal: number;
    saleStartsAt?: Date | null;
    saleEndsAt?: Date | null;
    perOrderLimit?: number | null;
  }) {
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, organisationId: input.orgId },
      select: { id: true },
    });
    if (!event) throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });

    const tier = await prisma.ticketTier.create({
      data: {
        eventId: input.eventId,
        name: input.name.trim(),
        description: input.description ?? null,
        priceNgn: input.priceNgn,
        quantityTotal: input.quantityTotal,
        saleStartsAt: input.saleStartsAt ?? null,
        saleEndsAt: input.saleEndsAt ?? null,
        perOrderLimit: input.perOrderLimit ?? 10,
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'ticketTier.created',
      entityType: 'ticketTier',
      entityId: tier.id,
    });

    return tier;
  }

  async createCheckout(input: {
    eventId: string;
    ticketTierId: string;
    quantity: number;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
  }) {
    const tier = await prisma.ticketTier.findFirst({
      where: { id: input.ticketTierId, eventId: input.eventId, isActive: true },
    });
    if (!tier) throw new AppError({ status: 404, code: 'TIER_NOT_FOUND', message: 'Ticket tier not found' });

    const now = new Date();
    if (tier.saleStartsAt && tier.saleStartsAt > now) {
      throw new AppError({ status: 409, code: 'SALE_NOT_STARTED', message: 'Ticket sales have not started' });
    }
    if (tier.saleEndsAt && tier.saleEndsAt < now) {
      throw new AppError({ status: 409, code: 'SALE_ENDED', message: 'Ticket sales have ended' });
    }

    if (input.quantity < 1 || input.quantity > tier.perOrderLimit) {
      throw new AppError({ status: 400, code: 'BAD_REQUEST', message: 'Invalid quantity' });
    }

    const remaining = tier.quantityTotal - tier.quantitySold;
    if (remaining < input.quantity) {
      throw new AppError({ status: 409, code: 'SOLD_OUT', message: 'Not enough tickets remaining' });
    }

    const paystackRef = `evvnt_${nanoid(18)}`;
    const amountNgn = tier.priceNgn * input.quantity;

    const order = await prisma.ticketOrder.create({
      data: {
        eventId: input.eventId,
        ticketTierId: input.ticketTierId,
        buyerEmail: input.buyerEmail?.trim().toLowerCase() ?? null,
        buyerPhone: input.buyerPhone?.trim() ?? null,
        quantity: input.quantity,
        amountNgn,
        paystackRef,
        status: TicketOrderStatus.INITIATED,
      },
    });

    // The frontend will initialize Paystack payment using `reference` and `amount`
    // Amount should be in kobo for Paystack checkout; we return both for clarity.
    return {
      order,
      paystack: {
        reference: paystackRef,
        amountNgn,
        amountKobo: amountNgn * 100,
        email: order.buyerEmail,
      },
    };
  }

  async handlePaystackChargeSuccess(input: { providerEventId: string; reference: string; amountKobo?: number | null }) {
    // Idempotency is done at PaymentEvent layer already; this handles business side.
    const order = await prisma.ticketOrder.findFirst({
      where: { paystackRef: input.reference },
      include: { ticketTier: true },
    });
    if (!order) return { ok: false as const, reason: 'ORDER_NOT_FOUND' as const };
    if (order.status === TicketOrderStatus.PAID) return { ok: true as const, alreadyProcessed: true as const };

    // Optional: amount verification (if payload provides it)
    if (input.amountKobo != null) {
      const expectedKobo = order.amountNgn * 100;
      if (input.amountKobo !== expectedKobo) {
        throw new AppError({ status: 409, code: 'AMOUNT_MISMATCH', message: 'Payment amount mismatch' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock tier via update to avoid oversell in simple way (MVP)
      const tier = await tx.ticketTier.findUnique({ where: { id: order.ticketTierId } });
      if (!tier) throw new AppError({ status: 404, code: 'TIER_NOT_FOUND', message: 'Ticket tier not found' });
      const remaining = tier.quantityTotal - tier.quantitySold;
      if (remaining < order.quantity) {
        throw new AppError({ status: 409, code: 'SOLD_OUT', message: 'Tier sold out while processing payment' });
      }

      await tx.ticketTier.update({
        where: { id: tier.id },
        data: { quantitySold: { increment: order.quantity } },
      });

      const updatedOrder = await tx.ticketOrder.update({
        where: { id: order.id },
        data: { status: TicketOrderStatus.PAID, paidAt: new Date() },
      });

      const tickets = await Promise.all(
        Array.from({ length: order.quantity }).map(() =>
          tx.ticket.create({
            data: {
              eventId: order.eventId,
              orderId: order.id,
              qrToken: nanoid(24),
            },
          }),
        ),
      );

      return { updatedOrder, tickets };
    });

    return { ok: true as const, order: result.updatedOrder, tickets: result.tickets };
  }

  async validateQrToken(eventId: string, qrToken: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { eventId, qrToken },
      select: { id: true, orderId: true, issuedAt: true },
    });
    if (!ticket) return { valid: false as const, reason: 'NOT_FOUND' as const };

    const checkIn = await prisma.checkIn.findFirst({ where: { ticketId: ticket.id }, select: { scannedAt: true } });
    if (checkIn) return { valid: false as const, reason: 'ALREADY_USED' as const, scannedAt: checkIn.scannedAt };

    return { valid: true as const, ticketId: ticket.id };
  }

  async scan(input: { orgId: string; actorUserId: string; eventId: string; qrToken: string }) {
    const validation = await this.validateQrToken(input.eventId, input.qrToken);
    if (!validation.valid) return validation;

    try {
      const checkIn = await prisma.checkIn.create({
        data: {
          eventId: input.eventId,
          ticketId: validation.ticketId,
          scannedByUserId: input.actorUserId,
        },
      });

      await this.audit.log({
        organisationId: input.orgId,
        eventId: input.eventId,
        actorUserId: input.actorUserId,
        action: 'ticket.checked_in',
        entityType: 'ticket',
        entityId: validation.ticketId,
      });

      return { valid: true as const, scannedAt: checkIn.scannedAt };
    } catch {
      // Unique(ticketId) will throw if already scanned concurrently
      return { valid: false as const, reason: 'ALREADY_USED' as const };
    }
  }

  async offlineBundle(input: { orgId: string; eventId: string }) {
    // For MVP: return list of qrTokens. The scanner can cache and validate tokens offline.
    // (Signing can be added later; this endpoint is authenticated anyway.)
    const tickets = await prisma.ticket.findMany({
      where: { eventId: input.eventId, event: { organisationId: input.orgId } },
      select: { qrToken: true, id: true },
    });
    return { tickets };
  }
}

