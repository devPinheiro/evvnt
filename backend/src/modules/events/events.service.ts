import { inject, injectable } from 'inversify';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../http/errors.js';
import { slugify } from '../../utils/slugify.js';
import { TYPES } from '../../di/types.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'ENDED' | 'ARCHIVED' | 'CANCELLED';

@injectable()
export class EventsService {
  constructor(
    @inject(TYPES.AuditService) private audit: AuditService,
    @inject(TYPES.NotificationsService) private notifications: NotificationsService,
  ) {}

  async list(orgId: string) {
    return prisma.event.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organisationId: orgId },
    });
    if (!event) {
      throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });
    }
    return event;
  }

  async create(input: {
    orgId: string;
    actorUserId: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    coverImageUrl?: string | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    timezone?: string | null;
    location?: string | null;
    isOnline?: boolean | null;
  }) {
    const base = slugify(input.slug?.trim() || input.name);
    if (!base) {
      throw new AppError({ status: 400, code: 'BAD_REQUEST', message: 'Invalid event slug' });
    }

    const slug = await this.ensureUniqueSlug(input.orgId, base);

    const event = await prisma.event.create({
      data: {
        organisationId: input.orgId,
        name: input.name.trim(),
        slug,
        description: input.description ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        timezone: input.timezone ?? null,
        location: input.location ?? null,
        isOnline: input.isOnline ?? false,
        status: 'DRAFT',
        memberships: {
          create: {
            userId: input.actorUserId,
            role: 'OWNER',
          },
        },
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: event.id,
      actorUserId: input.actorUserId,
      action: 'event.created',
      entityType: 'event',
      entityId: event.id,
      metadata: { slug: event.slug },
    });

    return event;
  }

  async update(input: {
    orgId: string;
    actorUserId: string;
    eventId: string;
    name?: string | null;
    description?: string | null;
    coverImageUrl?: string | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    timezone?: string | null;
    location?: string | null;
    isOnline?: boolean | null;
  }) {
    const existing = await this.get(input.orgId, input.eventId);

    if ((existing.status as EventStatus) === 'ARCHIVED') {
      throw new AppError({ status: 409, code: 'EVENT_ARCHIVED', message: 'Cannot modify an archived event' });
    }

    const event = await prisma.event.update({
      where: { id: existing.id },
      data: {
        name: input.name != null ? input.name.trim() : undefined,
        description: input.description ?? undefined,
        coverImageUrl: input.coverImageUrl ?? undefined,
        startsAt: input.startsAt ?? undefined,
        endsAt: input.endsAt ?? undefined,
        timezone: input.timezone ?? undefined,
        location: input.location ?? undefined,
        isOnline: input.isOnline ?? undefined,
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: event.id,
      actorUserId: input.actorUserId,
      action: 'event.updated',
      entityType: 'event',
      entityId: event.id,
    });

    return event;
  }

  async publish(input: { orgId: string; actorUserId: string; eventId: string }) {
    const existing = await this.get(input.orgId, input.eventId);

    if ((existing.status as EventStatus) === 'CANCELLED') {
      throw new AppError({ status: 409, code: 'EVENT_CANCELLED', message: 'Cancelled event cannot be published' });
    }
    if ((existing.status as EventStatus) !== 'DRAFT') {
      throw new AppError({ status: 409, code: 'INVALID_STATUS', message: 'Only draft events can be published' });
    }
    if (existing.startsAt && existing.startsAt.getTime() < Date.now()) {
      throw new AppError({
        status: 400,
        code: 'EVENT_DATE_IN_PAST',
        message: 'Event start date must be in the future to publish',
      });
    }

    const event = await prisma.event.update({
      where: { id: existing.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: event.id,
      actorUserId: input.actorUserId,
      action: 'event.published',
      entityType: 'event',
      entityId: event.id,
    });

    await this.notifications.notifyInApp({
      organisationId: input.orgId,
      userId: input.actorUserId,
      title: 'Your event is live',
      body: `“${event.name}” has been published.`,
      data: { eventId: event.id },
    });

    return event;
  }

  async cancel(input: { orgId: string; actorUserId: string; eventId: string }) {
    const existing = await this.get(input.orgId, input.eventId);
    if ((existing.status as EventStatus) === 'CANCELLED') return existing;

    const event = await prisma.event.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: event.id,
      actorUserId: input.actorUserId,
      action: 'event.cancelled',
      entityType: 'event',
      entityId: event.id,
    });

    return event;
  }

  async clone(input: {
    orgId: string;
    actorUserId: string;
    sourceEventId: string;
    name?: string | null;
    slug?: string | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
  }) {
    const source = await this.get(input.orgId, input.sourceEventId);

    const baseSlug = slugify(input.slug?.trim() || input.name?.trim() || `${source.slug}-copy`);
    const slug = await this.ensureUniqueSlug(input.orgId, baseSlug || `${source.slug}-copy`);

    const newName = input.name?.trim() || `${source.name} (Copy)`;

    const event = await prisma.event.create({
      data: {
        organisationId: input.orgId,
        name: newName,
        slug,
        description: source.description,
        coverImageUrl: source.coverImageUrl,
        startsAt: input.startsAt ?? source.startsAt,
        endsAt: input.endsAt ?? source.endsAt,
        timezone: source.timezone,
        location: source.location,
        isOnline: source.isOnline,
        status: 'DRAFT',
        memberships: {
          create: {
            userId: input.actorUserId,
            role: 'OWNER',
          },
        },
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: event.id,
      actorUserId: input.actorUserId,
      action: 'event.cloned',
      entityType: 'event',
      entityId: event.id,
      metadata: { sourceEventId: source.id },
    });

    return event;
  }

  private async ensureUniqueSlug(orgId: string, baseSlug: string) {
    const cleanBase = slugify(baseSlug);
    if (!cleanBase) return 'event';

    // Try base, then base-2..base-50
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? cleanBase : `${cleanBase}-${i + 1}`;
      const exists = await prisma.event.findFirst({
        where: { organisationId: orgId, slug: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }

    throw new AppError({
      status: 409,
      code: 'SLUG_UNAVAILABLE',
      message: 'Unable to allocate a unique event slug',
    });
  }
}

