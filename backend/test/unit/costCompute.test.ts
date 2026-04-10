import { describe, it, expect } from 'vitest';
import { computeCost } from '../../src/modules/planner/costCompute.js';
import { defaultCostState } from '../../src/modules/planner/planner.defaults.js';

describe('computeCost', () => {
  it('applies contingency to grand total', () => {
    const state = defaultCostState();
    state.costGuestCount = 100;
    state.contingencyPercent = 10;
    state.categories.FOOD = [{ id: '1', name: 'X', unitCostNgn: 1000, qtyPerGuest: 1 }];
    state.categories.DRINKS = [];
    state.categories.SOUVENIRS = [];
    state.categories.LOGISTICS = [];

    const out = computeCost(state);
    expect(out.baseTotalNgn).toBe(100_000);
    expect(out.contingencyNgn).toBe(10_000);
    expect(out.grandTotalNgn).toBe(110_000);
    expect(out.perHeadNgn).toBe(1100);
  });

  it('sets contingencyHighWarning when buffer > 50%', () => {
    const state = defaultCostState();
    state.contingencyPercent = 55;
    const out = computeCost(state);
    expect(out.contingencyHighWarning).toBe(true);
  });
});
