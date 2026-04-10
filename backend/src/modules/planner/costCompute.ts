import type { CostCategoryKey, CostComputeResult, CostState } from './planner.types.js';

const CATEGORY_LABELS: Record<CostCategoryKey, string> = {
  FOOD: 'Food & catering',
  DRINKS: 'Drinks & bar',
  SOUVENIRS: 'Souvenirs & aso-ebi',
  LOGISTICS: 'Security & logistics',
};

/** Lagos per-head benchmark bands (₦) — PRD Module 09 */
const BUDGET_MIN = 15_000;
const BUDGET_MAX = 25_000;
const MID_MIN = 25_000;
const MID_MAX = 50_000;
const PREM_MIN = 50_000;
const PREM_MAX = 120_000;

export function computeCost(state: CostState): CostComputeResult {
  const guests = Math.max(0, Math.floor(state.costGuestCount));
  const contingencyPercent = Math.max(0, state.contingencyPercent);

  const keys: CostCategoryKey[] = ['FOOD', 'DRINKS', 'SOUVENIRS', 'LOGISTICS'];
  const categories: CostComputeResult['categories'] = [];
  const perHeadByCategory: Record<CostCategoryKey, number> = {
    FOOD: 0,
    DRINKS: 0,
    SOUVENIRS: 0,
    LOGISTICS: 0,
  };

  for (const key of keys) {
    const lines = state.categories[key] ?? [];
    let sub = 0;
    for (const li of lines) {
      const unit = Math.max(0, li.unitCostNgn);
      const qty = Math.max(0, li.qtyPerGuest);
      sub += unit * qty * guests;
    }
    sub = Math.round(sub);
    const perHead = guests > 0 ? Math.round(sub / guests) : 0;
    perHeadByCategory[key] = perHead;
    categories.push({ key, label: CATEGORY_LABELS[key], subtotalNgn: sub, perHeadNgn: perHead });
  }

  const baseTotalNgn = categories.reduce((s, c) => s + c.subtotalNgn, 0);
  const contingencyNgn = Math.round((baseTotalNgn * contingencyPercent) / 100);
  const grandTotalNgn = baseTotalNgn + contingencyNgn;
  const perHeadNgn = guests > 0 ? Math.round(grandTotalNgn / guests) : 0;

  let band: CostComputeResult['marketBenchmark']['band'] = 'MID_RANGE';
  let label = 'Mid-range';
  let rangeMinNgn = MID_MIN;
  let rangeMaxNgn = MID_MAX;

  if (perHeadNgn < BUDGET_MIN) {
    band = 'BELOW_BUDGET';
    label = 'Below typical budget band';
    rangeMinNgn = 0;
    rangeMaxNgn = BUDGET_MIN - 1;
  } else if (perHeadNgn <= BUDGET_MAX) {
    band = 'BUDGET';
    label = 'Budget';
    rangeMinNgn = BUDGET_MIN;
    rangeMaxNgn = BUDGET_MAX;
  } else if (perHeadNgn <= MID_MAX) {
    band = 'MID_RANGE';
    label = 'Mid-range';
    rangeMinNgn = MID_MIN;
    rangeMaxNgn = MID_MAX;
  } else if (perHeadNgn <= PREM_MAX) {
    band = 'PREMIUM';
    label = 'Premium';
    rangeMinNgn = PREM_MIN;
    rangeMaxNgn = PREM_MAX;
  } else {
    band = 'ABOVE_PREMIUM';
    label = 'Above premium band';
    rangeMinNgn = PREM_MAX + 1;
    rangeMaxNgn = perHeadNgn;
  }

  return {
    guests,
    categories,
    baseTotalNgn,
    contingencyPercent,
    contingencyNgn,
    grandTotalNgn,
    perHeadNgn,
    perHeadByCategoryNgn: perHeadByCategory,
    marketBenchmark: { band, label, rangeMinNgn, rangeMaxNgn },
    contingencyHighWarning: contingencyPercent > 50,
  };
}
