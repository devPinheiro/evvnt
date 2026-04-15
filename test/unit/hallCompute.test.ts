import { describe, it, expect } from 'vitest';
import { computeHall } from '../../src/modules/planner/hallCompute.js';
import { defaultHallState } from '../../src/modules/planner/planner.defaults.js';

describe('computeHall', () => {
  it('computes tables for a simple rectangular hall with no optional zones', () => {
    const state = {
      ...defaultHallState(),
      hallLengthM: 30,
      hallWidthM: 20,
      hallGuestCount: 100,
      aisleCount: 0,
      stageAreaM2: 0,
      headTableZone: false,
      barBuffetZone: false,
      danceFloor: false,
      tableShape: 'ROUND' as const,
      roundDiameterM: 1.8,
      seatsPerTable: 8,
    };
    const out = computeHall(state);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.totalAreaM2).toBe(600);
    expect(out.result.usableAreaM2).toBe(600);
    const footprint = (1.8 + 2.2) ** 2;
    expect(out.result.effectiveTableFootprintM2).toBeCloseTo(footprint, 5);
    expect(out.result.tablesThatFit).toBe(Math.floor(600 / footprint));
    expect(out.result.maxSeats).toBe(out.result.tablesThatFit * 8);
    expect(out.result.capacityStatus).toBe('COMFORTABLE');
  });

  it('returns errors for invalid dimensions', () => {
    const out = computeHall({
      ...defaultHallState(),
      hallLengthM: 0,
      hallWidthM: 10,
    });
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.errors.length).toBeGreaterThan(0);
  });

  it('flags insufficient capacity when guests exceed max seats', () => {
    const out = computeHall({
      ...defaultHallState(),
      hallLengthM: 10,
      hallWidthM: 10,
      hallGuestCount: 5000,
      aisleCount: 0,
      stageAreaM2: 0,
      headTableZone: false,
      barBuffetZone: false,
      danceFloor: false,
      tableShape: 'ROUND',
      roundDiameterM: 3,
      seatsPerTable: 8,
    });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.capacityStatus).toBe('INSUFFICIENT');
    expect(out.result.suggestions.length).toBeGreaterThan(0);
  });
});
