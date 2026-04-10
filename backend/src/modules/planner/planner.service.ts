import { inject, injectable } from 'inversify';
import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../http/errors.js';
import { TYPES } from '../../di/types.js';
import { AuditService } from '../audit/audit.service.js';
import { computeHall } from './hallCompute.js';
import { computeCost } from './costCompute.js';
import { defaultCostState, defaultHallState } from './planner.defaults.js';
import type { CostState, HallState } from './planner.types.js';
import { CostStateSchema, HallStateSchema } from './planner.schemas.js';

const PLANNER_BUDGET_SOURCE = 'planner_budget' as const;

function mergeHall(raw: unknown): HallState {
  const base = defaultHallState();
  const parsed = HallStateSchema.safeParse(raw);
  if (!parsed.success) return base;
  return { ...base, ...parsed.data };
}

function mergeCost(raw: unknown): CostState {
  const base = defaultCostState();
  const parsed = CostStateSchema.safeParse(raw);
  if (!parsed.success) return base;
  return {
    costGuestCount: parsed.data.costGuestCount,
    contingencyPercent: parsed.data.contingencyPercent,
    categories: {
      FOOD: parsed.data.categories.FOOD.length ? parsed.data.categories.FOOD : base.categories.FOOD,
      DRINKS: parsed.data.categories.DRINKS.length ? parsed.data.categories.DRINKS : base.categories.DRINKS,
      SOUVENIRS: parsed.data.categories.SOUVENIRS.length ? parsed.data.categories.SOUVENIRS : base.categories.SOUVENIRS,
      LOGISTICS: parsed.data.categories.LOGISTICS.length ? parsed.data.categories.LOGISTICS : base.categories.LOGISTICS,
    },
  };
}

@injectable()
export class PlannerService {
  constructor(@inject(TYPES.AuditService) private audit: AuditService) {}

  private async ensureEvent(orgId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organisationId: orgId },
      select: { id: true },
    });
    if (!event) {
      throw new AppError({ status: 404, code: 'EVENT_NOT_FOUND', message: 'Event not found' });
    }
  }

  async getSnapshot(input: { orgId: string; eventId: string }) {
    await this.ensureEvent(input.orgId, input.eventId);

    const row = await prisma.eventPlannerSettings.findUnique({ where: { eventId: input.eventId } });
    const hallState = mergeHall(row?.hallState ?? {});
    const costState = mergeCost(row?.costState ?? {});

    const hallOut = computeHall(hallState);
    const costOut = computeCost(costState);

    return {
      hallState,
      costState,
      hall: hallOut,
      cost: costOut,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async saveState(input: {
    orgId: string;
    eventId: string;
    actorUserId: string;
    hallState: HallState;
    costState: CostState;
  }) {
    await this.ensureEvent(input.orgId, input.eventId);

    HallStateSchema.parse(input.hallState);
    CostStateSchema.parse(input.costState);

    const row = await prisma.eventPlannerSettings.upsert({
      where: { eventId: input.eventId },
      create: {
        eventId: input.eventId,
        hallState: input.hallState as unknown as Prisma.InputJsonValue,
        costState: input.costState as unknown as Prisma.InputJsonValue,
      },
      update: {
        hallState: input.hallState as unknown as Prisma.InputJsonValue,
        costState: input.costState as unknown as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'planner.state_saved',
      entityType: 'event_planner',
      entityId: input.eventId,
    });

    const hallOut = computeHall(input.hallState);
    const costOut = computeCost(input.costState);

    return { hallState: input.hallState, costState: input.costState, hall: hallOut, cost: costOut, updatedAt: row.updatedAt };
  }

  async pushBudget(input: {
    orgId: string;
    eventId: string;
    actorUserId: string;
    mode: 'merge' | 'replace';
  }) {
    await this.ensureEvent(input.orgId, input.eventId);

    const row = await prisma.eventPlannerSettings.findUnique({ where: { eventId: input.eventId } });
    const costState = mergeCost(row?.costState ?? {});
    const costOut = computeCost(costState);

    const keysToWrite: string[] = costOut.categories.filter((c) => c.subtotalNgn > 0).map((c) => c.key);
    if (costOut.contingencyNgn > 0) keysToWrite.push('CONTINGENCY');

    if (input.mode === 'replace') {
      await prisma.financeEntry.deleteMany({
        where: {
          eventId: input.eventId,
          metadata: { path: ['source'], equals: PLANNER_BUDGET_SOURCE },
        },
      });
    } else if (keysToWrite.length > 0) {
      await prisma.financeEntry.deleteMany({
        where: {
          eventId: input.eventId,
          AND: [
            { metadata: { path: ['source'], equals: PLANNER_BUDGET_SOURCE } },
            { OR: keysToWrite.map((k) => ({ metadata: { path: ['categoryKey'], equals: k } })) },
          ],
        },
      });
    }

    const created: { id: string; category: string | null; amountNgn: number }[] = [];
    const pushedAt = new Date().toISOString();

    for (const cat of costOut.categories) {
      if (cat.subtotalNgn <= 0) continue;

      const entry = await prisma.financeEntry.create({
        data: {
          eventId: input.eventId,
          type: 'EXPENSE',
          status: 'LOGGED',
          category: `Planner · ${cat.label}`,
          amountNgn: cat.subtotalNgn,
          description: `Event Planner estimate · ${cat.label} · ${costOut.guests} guests · per-head ~₦${cat.perHeadNgn.toLocaleString('en-NG')} (base, before contingency)`,
          metadata: {
            source: PLANNER_BUDGET_SOURCE,
            categoryKey: cat.key,
            pushedAt,
            guests: costOut.guests,
            contingencyPercent: costOut.contingencyPercent,
          } as Prisma.InputJsonValue,
        },
      });
      created.push({ id: entry.id, category: entry.category, amountNgn: entry.amountNgn });
    }

    if (costOut.contingencyNgn > 0) {
      const entry = await prisma.financeEntry.create({
        data: {
          eventId: input.eventId,
          type: 'EXPENSE',
          status: 'LOGGED',
          category: 'Planner · Contingency buffer',
          amountNgn: costOut.contingencyNgn,
          description: `Event Planner · ${costOut.contingencyPercent}% contingency on base ₦${costOut.baseTotalNgn.toLocaleString('en-NG')}`,
          metadata: {
            source: PLANNER_BUDGET_SOURCE,
            categoryKey: 'CONTINGENCY',
            pushedAt,
            guests: costOut.guests,
            contingencyPercent: costOut.contingencyPercent,
          } as Prisma.InputJsonValue,
        },
      });
      created.push({ id: entry.id, category: entry.category, amountNgn: entry.amountNgn });
    }

    await this.audit.log({
      organisationId: input.orgId,
      eventId: input.eventId,
      actorUserId: input.actorUserId,
      action: 'planner.pushed_budget',
      entityType: 'event_planner',
      entityId: input.eventId,
      metadata: { mode: input.mode, lines: created.length },
    });

    return { createdCount: created.length, entries: created, cost: costOut };
  }
}
