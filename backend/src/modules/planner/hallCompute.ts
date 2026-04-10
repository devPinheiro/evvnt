import type { HallComputeResult, HallState } from './planner.types.js';

const HEAD_TABLE_M2 = 20;
const BAR_BUFFET_M2 = 15;
const DANCE_FLOOR_M2 = 25;
const AISLE_WIDTH_M = 1.5;
/** Chair clearance + table gap bundled per PRD bounding-box rules */
const ROUND_CLEARANCE_M = 2.2;
const RECT_WIDTH_EXTRA_M = 2.2;
const RECT_LENGTH_GAP_M = 1.0;

export type HallComputeOutput = { ok: true; result: HallComputeResult } | { ok: false; errors: string[] };

export function computeHall(state: HallState): HallComputeOutput {
  const errors: string[] = [];
  const L = state.hallLengthM;
  const W = state.hallWidthM;

  if (!Number.isFinite(L) || L <= 0) errors.push('Hall length must be greater than 0.');
  if (!Number.isFinite(W) || W <= 0) errors.push('Hall width must be greater than 0.');
  if (!Number.isFinite(state.hallGuestCount) || state.hallGuestCount < 0) {
    errors.push('Expected guest count cannot be negative.');
  }
  if (!Number.isFinite(state.seatsPerTable) || state.seatsPerTable < 4 || state.seatsPerTable > 14) {
    errors.push('Seats per table must be between 4 and 14.');
  }

  let footprint = 0;
  if (state.tableShape === 'ROUND') {
    const d = state.roundDiameterM;
    if (!Number.isFinite(d) || d <= 0) errors.push('Round table diameter must be greater than 0.');
    else footprint = (d + ROUND_CLEARANCE_M) ** 2;
  } else {
    const tw = state.rectangularTableWidthM;
    const tl = state.rectangularTableLengthM;
    if (!Number.isFinite(tw) || tw <= 0) errors.push('Rectangular table width must be greater than 0.');
    if (!Number.isFinite(tl) || tl <= 0) errors.push('Rectangular table length must be greater than 0.');
    else footprint = (tw + RECT_WIDTH_EXTRA_M) * (tl + RECT_LENGTH_GAP_M);
  }

  if (errors.length) return { ok: false, errors };

  const totalArea = L * W;
  const deductions: HallComputeResult['deductions'] = [];
  const stageWarnings: string[] = [];

  let stageApplied = Math.max(0, state.stageAreaM2);
  if (stageApplied > totalArea * 0.8) {
    stageApplied = totalArea * 0.8;
    stageWarnings.push('Stage area capped at 80% of total hall area — insufficient seating space otherwise.');
  }
  deductions.push({ key: 'stage', label: 'Stage / altar / podium', m2: stageApplied });

  const aisleM2 = Math.max(0, state.aisleCount) * AISLE_WIDTH_M * L;
  deductions.push({
    key: 'aisles',
    label: `Aisles (${state.aisleCount} × ${AISLE_WIDTH_M}m × ${L}m hall length)`,
    m2: aisleM2,
  });

  const headM2 = state.headTableZone ? HEAD_TABLE_M2 : 0;
  if (headM2) deductions.push({ key: 'head_table', label: 'Head table zone', m2: headM2 });

  const barM2 = state.barBuffetZone ? BAR_BUFFET_M2 : 0;
  if (barM2) deductions.push({ key: 'bar', label: 'Bar / buffet zone', m2: barM2 });

  const danceM2 = state.danceFloor ? DANCE_FLOOR_M2 : 0;
  if (danceM2) deductions.push({ key: 'dance', label: 'Dance floor', m2: danceM2 });

  const deducted = deductions.reduce((s, d) => s + d.m2, 0);
  let usable = totalArea - deducted;
  if (usable < 0) {
    usable = 0;
    errors.push('Deductions exceed total hall area — reduce stage, aisles, or optional zones.');
  }

  const tablesThatFit = footprint > 0 ? Math.floor(usable / footprint) : 0;
  const maxSeats = tablesThatFit * state.seatsPerTable;

  const g = state.hallGuestCount;
  const spacePerGuest = g > 0 ? usable / g : null;

  let capacityStatus: HallComputeResult['capacityStatus'] = 'UNKNOWN';
  if (g <= 0) capacityStatus = 'UNKNOWN';
  else if (maxSeats < g) capacityStatus = 'INSUFFICIENT';
  else if (spacePerGuest != null) {
    if (spacePerGuest >= 1.5) capacityStatus = 'COMFORTABLE';
    else if (spacePerGuest >= 1.1) capacityStatus = 'ADEQUATE';
    else capacityStatus = 'TIGHT';
  }

  const suggestions: string[] = [];
  if (capacityStatus === 'INSUFFICIENT') {
    suggestions.push('Reduce expected guest count or choose a larger hall.');
    suggestions.push('Reduce stage size, optional zones, or aisle count to recover seating area.');
    suggestions.push('Try smaller table footprint (smaller diameter / dimensions) or adjust seats per table.');
    const shortBy = g - maxSeats;
    if (shortBy > 0) suggestions.push(`Capacity shortfall: about ${shortBy} guests over current max seats (${maxSeats}).`);
  } else if (capacityStatus === 'TIGHT') {
    suggestions.push('Space per guest is under 1.1m² — consider fewer guests or a larger usable area.');
  }

  const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, tablesThatFit))));
  const rows = Math.max(1, Math.ceil(tablesThatFit / cols));

  const result: HallComputeResult = {
    totalAreaM2: totalArea,
    deductions,
    usableAreaM2: usable,
    usablePercentOfTotal: totalArea > 0 ? (usable / totalArea) * 100 : 0,
    stageAreaAppliedM2: stageApplied,
    stageCapped: state.stageAreaM2 > stageApplied,
    stageWarnings,
    effectiveTableFootprintM2: footprint,
    tablesThatFit,
    maxSeats,
    spacePerGuestM2: spacePerGuest,
    capacityStatus,
    suggestions,
    floorPlan: {
      hallAspectWidthOverLength: L > 0 ? W / L : 1,
      stageNorm: { x: 0.05, y: 0.05, w: 0.35, h: 0.22 },
      tableGrid: { cols, rows, placedTables: tablesThatFit, shape: state.tableShape },
    },
  };

  if (errors.length) return { ok: false, errors };
  return { ok: true, result };
}
