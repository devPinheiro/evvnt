import { inject, injectable } from 'inversify';
import { FinanceEntryType, FinanceStatus, VendorEngagementStatus, VendorType } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../http/errors.js';
import { TYPES } from '../../di/types.js';
import { AuditService } from '../audit/audit.service.js';

@injectable()
export class VendorsService {
  constructor(@inject(TYPES.AuditService) private audit: AuditService) {}

  async list(orgId: string, eventId: string) {
    return prisma.vendor.findMany({
      where: { eventId, event: { organisationId: orgId } },
      orderBy: { createdAt: 'desc' },
      include: { tasks: true, milestones: true, invoices: true },
    });
  }

  async addVendor(input: {
    orgId: string;
    actorUserId: string;
    eventId: string;
    name: string;
    type: VendorType;
    email?: string | null;
    phone?: string | null;
    agreedFeeNgn: number;
  }) {
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, organisationId: input.orgId },
      select: { id: true },
    });
    if (!event) throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });

    const vendor = await prisma.vendor.create({
      data: {
        eventId: input.eventId,
        name: input.name.trim(),
        type: input.type,
        email: input.email?.trim().toLowerCase() ?? null,
        phone: input.phone?.trim() ?? null,
        agreedFeeNgn: input.agreedFeeNgn,
        status: VendorEngagementStatus.PENDING,
        financeEntries: {
          create: {
            eventId: input.eventId,
            type: FinanceEntryType.EXPENSE,
            status: FinanceStatus.LOGGED,
            category: 'Vendor',
            amountNgn: input.agreedFeeNgn,
            description: `Vendor commitment: ${input.name.trim()}`,
          },
        },
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'vendor.created',
      entityType: 'vendor',
      entityId: vendor.id,
    });

    return vendor;
  }

  async addTask(input: {
    orgId: string;
    actorUserId: string;
    eventId: string;
    vendorId: string;
    title: string;
    description?: string | null;
    dueAt?: Date | null;
  }) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: input.vendorId, eventId: input.eventId, event: { organisationId: input.orgId } },
      select: { id: true },
    });
    if (!vendor) throw new AppError({ status: 404, code: 'VENDOR_NOT_FOUND', message: 'Vendor not found' });

    const task = await prisma.vendorTask.create({
      data: {
        vendorId: input.vendorId,
        title: input.title.trim(),
        description: input.description ?? null,
        dueAt: input.dueAt ?? null,
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'vendorTask.created',
      entityType: 'vendorTask',
      entityId: task.id,
    });

    return task;
  }

  async addMilestone(input: {
    orgId: string;
    actorUserId: string;
    eventId: string;
    vendorId: string;
    title: string;
    amountNgn: number;
    dueAt?: Date | null;
  }) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: input.vendorId, eventId: input.eventId, event: { organisationId: input.orgId } },
      select: { id: true, name: true },
    });
    if (!vendor) throw new AppError({ status: 404, code: 'VENDOR_NOT_FOUND', message: 'Vendor not found' });

    const milestone = await prisma.vendorMilestone.create({
      data: {
        vendorId: input.vendorId,
        title: input.title.trim(),
        amountNgn: input.amountNgn,
        dueAt: input.dueAt ?? null,
      },
    });

    await prisma.financeEntry.create({
      data: {
        eventId: input.eventId,
        vendorId: input.vendorId,
        type: FinanceEntryType.EXPENSE,
        status: FinanceStatus.PENDING_PAYMENT,
        category: 'VendorMilestone',
        amountNgn: input.amountNgn,
        description: `Milestone: ${vendor.name} — ${input.title.trim()}`,
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'vendorMilestone.created',
      entityType: 'vendorMilestone',
      entityId: milestone.id,
    });

    return milestone;
  }

  async submitInvoice(input: {
    orgId: string;
    actorUserId: string;
    eventId: string;
    vendorId: string;
    amountNgn: number;
    note?: string | null;
  }) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: input.vendorId, eventId: input.eventId, event: { organisationId: input.orgId } },
      select: { id: true, name: true },
    });
    if (!vendor) throw new AppError({ status: 404, code: 'VENDOR_NOT_FOUND', message: 'Vendor not found' });

    const invoice = await prisma.vendorInvoice.create({
      data: { vendorId: input.vendorId, amountNgn: input.amountNgn, note: input.note ?? null },
    });

    await prisma.financeEntry.create({
      data: {
        eventId: input.eventId,
        vendorId: input.vendorId,
        type: FinanceEntryType.EXPENSE,
        status: FinanceStatus.PENDING_PAYMENT,
        category: 'VendorInvoice',
        amountNgn: input.amountNgn,
        description: `Invoice: ${vendor.name}`,
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'vendorInvoice.submitted',
      entityType: 'vendorInvoice',
      entityId: invoice.id,
    });

    return invoice;
  }
}

