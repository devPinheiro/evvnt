export type HallTableShape = 'ROUND' | 'RECTANGULAR';

export type HallState = {
  hallLengthM: number;
  hallWidthM: number;
  hallGuestCount: number;
  tableShape: HallTableShape;
  roundDiameterM: number;
  rectangularTableWidthM: number;
  rectangularTableLengthM: number;
  seatsPerTable: number;
  stageAreaM2: number;
  aisleCount: number;
  headTableZone: boolean;
  barBuffetZone: boolean;
  danceFloor: boolean;
};

export type CostCategoryKey = 'FOOD' | 'DRINKS' | 'SOUVENIRS' | 'LOGISTICS';

export type CostLineItem = {
  id: string;
  name: string;
  unitCostNgn: number;
  qtyPerGuest: number;
};

export type CostState = {
  costGuestCount: number;
  contingencyPercent: number;
  categories: Record<CostCategoryKey, CostLineItem[]>;
};

export type HallDeduction = { key: string; label: string; m2: number };

export type HallComputeResult = {
  totalAreaM2: number;
  deductions: HallDeduction[];
  usableAreaM2: number;
  usablePercentOfTotal: number;
  stageAreaAppliedM2: number;
  stageCapped: boolean;
  stageWarnings: string[];
  effectiveTableFootprintM2: number;
  tablesThatFit: number;
  maxSeats: number;
  spacePerGuestM2: number | null;
  capacityStatus: 'INSUFFICIENT' | 'TIGHT' | 'ADEQUATE' | 'COMFORTABLE' | 'UNKNOWN';
  suggestions: string[];
  floorPlan: {
    hallAspectWidthOverLength: number;
    stageNorm: { x: number; y: number; w: number; h: number };
    tableGrid: { cols: number; rows: number; placedTables: number; shape: HallTableShape };
  };
};

export type CostCategoryTotal = {
  key: CostCategoryKey;
  label: string;
  subtotalNgn: number;
  perHeadNgn: number;
};

export type CostComputeResult = {
  guests: number;
  categories: CostCategoryTotal[];
  baseTotalNgn: number;
  contingencyPercent: number;
  contingencyNgn: number;
  grandTotalNgn: number;
  perHeadNgn: number;
  perHeadByCategoryNgn: Record<CostCategoryKey, number>;
  marketBenchmark: {
    band: 'BELOW_BUDGET' | 'BUDGET' | 'MID_RANGE' | 'PREMIUM' | 'ABOVE_PREMIUM';
    label: string;
    rangeMinNgn: number;
    rangeMaxNgn: number;
  };
  contingencyHighWarning: boolean;
};
