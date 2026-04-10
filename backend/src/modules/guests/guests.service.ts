import { inject, injectable } from 'inversify';
import { nanoid } from 'nanoid';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../http/errors.js';
import { TYPES } from '../../di/types.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type RsvpStatus = 'NOT_SENT' | 'INVITED' | 'RSVP_YES' | 'RSVP_NO' | 'RSVP_MAYBE' | 'ARRIVED' | 'NO_SHOW';
type ExistingContact = { email: string | null; phone: string | null };

@injectable()
export class GuestsService {
  constructor(
    @inject(TYPES.AuditService) private audit: AuditService,
    @inject(TYPES.NotificationsService) private notifications: NotificationsService,
  ) {}

  async list(eventId: string, orgId: string) {
    return prisma.guest.findMany({
      where: { eventId, event: { organisationId: orgId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addGuest(input: {
    orgId: string;
    actorUserId: string;
    eventId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    groups?: string[] | null;
    plusOnes?: number | null;
    tableNo?: string | null;
    notes?: string | null;
  }) {
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, organisationId: input.orgId },
      select: { id: true },
    });
    if (!event) throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });

    const guest = await prisma.guest.create({
      data: {
        eventId: input.eventId,
        name: input.name.trim(),
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        groups: input.groups ?? [],
        plusOnes: input.plusOnes ?? 0,
        tableNo: input.tableNo ?? null,
        notes: input.notes ?? null,
        status: 'NOT_SENT',
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'guest.created',
      entityType: 'guest',
      entityId: guest.id,
    });

    return guest;
  }

  async dedupePreview(input: { eventId: string; orgId: string; candidates: Array<{ email?: string; phone?: string }> }) {
    // Very lightweight: find which candidate emails/phones already exist in this event
    const emails = Array.from(
      new Set(
        input.candidates
          .map((c) => c.email?.trim().toLowerCase())
          .filter((x): x is string => Boolean(x)),
      ),
    );
    const phones = Array.from(
      new Set(
        input.candidates
          .map((c) => c.phone?.trim())
          .filter((x): x is string => Boolean(x)),
      ),
    );

    const existing = await prisma.guest.findMany({
      where: {
        eventId: input.eventId,
        event: { organisationId: input.orgId },
        OR: [{ email: { in: emails.length ? emails : ['__none__'] } }, { phone: { in: phones.length ? phones : ['__none__'] } }],
      },
      select: { id: true, email: true, phone: true },
    });

    const existingEmails = new Set(
      (existing as ExistingContact[]).map((e) => e.email).filter((x): x is string => Boolean(x)),
    );
    const existingPhones = new Set(
      (existing as ExistingContact[]).map((e) => e.phone).filter((x): x is string => Boolean(x)),
    );

    return {
      duplicates: input.candidates.map((c) => ({
        email: c.email?.trim().toLowerCase() || null,
        phone: c.phone?.trim() || null,
        isDuplicate: (c.email && existingEmails.has(c.email.trim().toLowerCase())) || (c.phone && existingPhones.has(c.phone.trim())),
      })),
    };
  }

  async createInvite(input: { orgId: string; actorUserId: string; eventId: string; guestId?: string | null; channel?: string | null }) {
    // Ensure event belongs to org, and guest (if present) belongs to event
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, organisationId: input.orgId },
      select: { id: true, slug: true },
    });
    if (!event) throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });

    if (input.guestId) {
      const guest = await prisma.guest.findFirst({
        where: { id: input.guestId, eventId: input.eventId },
        select: { id: true },
      });
      if (!guest) throw new AppError({ status: 404, code: 'GUEST_NOT_FOUND', message: 'Guest not found' });
    }

    const token = nanoid(24);
    const invite = await prisma.invite.create({
      data: {
        eventId: input.eventId,
        guestId: input.guestId ?? null,
        token,
        channel: input.channel ?? null,
        sentAt: new Date(),
      },
    });

    if (input.guestId) {
      await prisma.guest.update({
        where: { id: input.guestId },
        data: { status: 'INVITED' },
      });
    }

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'invite.created',
      entityType: 'invite',
      entityId: invite.id,
      metadata: { guestId: input.guestId ?? null, channel: input.channel ?? null },
    });

    // Notify the host/co-host who sent it (in-app), and email the guest if we have an address.
    await this.notifications.notifyInApp({
      organisationId: input.orgId,
      userId: input.actorUserId,
      title: 'Invite sent',
      body: input.guestId ? `Invite sent to guest.` : `General invite link created.`,
      data: { eventId: input.eventId, inviteId: invite.id, guestId: input.guestId ?? null },
    });

    if (input.guestId) {
      const guest = await prisma.guest.findFirst({
        where: { id: input.guestId, eventId: input.eventId },
        select: { email: true, name: true },
      });
      if (guest?.email) {
        await this.notifications.notifyEmail({
          organisationId: input.orgId,
          userId: input.actorUserId,
          toEmail: guest.email,
          subject: 'You are invited',
          text: `Hello${guest.name ? ` ${guest.name}` : ''}!\n\nYou’re invited. RSVP here: ${invite.token}\n`,
          data: { eventId: input.eventId, inviteId: invite.id },
        });
      }
    }

    return { invite, urlPath: `/rsvp/${invite.token}` };
  }

  async rsvpSubmit(input: {
    token: string;
    status: RsvpStatus;
    guestName?: string | null;
    guestEmail?: string | null;
    guestPhone?: string | null;
    message?: string | null;
    plusOnes?: number | null;
  }) {
    const invite = await prisma.invite.findFirst({
      where: { token: input.token },
      include: { event: { select: { id: true, organisationId: true } }, guest: { select: { id: true } } },
    });
    if (!invite) throw new AppError({ status: 404, code: 'INVITE_NOT_FOUND', message: 'Invite not found' });

    // Record RSVP entry (append-only)
    const rsvp = await prisma.rSVP.create({
      data: {
        eventId: invite.eventId,
        inviteId: invite.id,
        guestId: invite.guestId,
        status: input.status,
        guestName: input.guestName ?? null,
        guestEmail: input.guestEmail?.trim().toLowerCase() ?? null,
        guestPhone: input.guestPhone?.trim() ?? null,
        message: input.message ?? null,
        plusOnes: input.plusOnes ?? 0,
      },
    });

    if (invite.guestId) {
      await prisma.guest.update({
        where: { id: invite.guestId },
        data: {
          status: input.status,
          plusOnes: input.plusOnes ?? undefined,
        },
      });
    }

    return { rsvp, eventId: invite.eventId };
  }
}

