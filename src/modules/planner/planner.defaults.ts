import { nanoid } from 'nanoid';
import type { CostCategoryKey, CostLineItem, CostState, HallState } from './planner.types.js';

function line(name: string, unitCostNgn: number, qtyPerGuest: number): CostLineItem {
  return { id: nanoid(8), name, unitCostNgn, qtyPerGuest };
}

/** Nigerian market-style defaults from PRD § Module 09 */
export const DEFAULT_COST_CATEGORIES: Record<CostCategoryKey, CostLineItem[]> = {
  FOOD: [
    line('Main course', 8500, 1),
    line('Small chops', 2500, 0.5),
    line('Catering staff', 500, 1),
    line('Dessert', 1200, 0.3),
  ],
  DRINKS: [
    line('Soft drinks', 800, 2),
    line('Beer / malt', 600, 1.5),
    line('Spirits (allocated)', 400, 0.5),
    line('Bartenders', 400, 0.2),
  ],
  SOUVENIRS: [
    line('Souvenir bag', 3500, 1),
    line('Aso-ebi fabric (allocated)', 8000, 0.3),
  ],
  LOGISTICS: [
    line('Security guards', 1500, 0.15),
    line('Generator / backup power', 800, 0.25),
  ],
};

export function defaultCostState(): CostState {
  return {
    costGuestCount: 200,
    contingencyPercent: 10,
    categories: JSON.parse(JSON.stringify(DEFAULT_COST_CATEGORIES)) as CostState['categories'],
  };
}

export function defaultHallState(): HallState {
  return {
    hallLengthM: 40,
    hallWidthM: 25,
    hallGuestCount: 200,
    tableShape: 'ROUND',
    roundDiameterM: 1.8,
    rectangularTableWidthM: 1.8,
    rectangularTableLengthM: 0.9,
    seatsPerTable: 8,
    stageAreaM2: 24,
    aisleCount: 2,
    headTableZone: true,
    barBuffetZone: true,
    danceFloor: true,
  };
}
