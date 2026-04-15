import { z } from 'zod';

export const HallTableShapeSchema = z.enum(['ROUND', 'RECTANGULAR']);

export const CostLineItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unitCostNgn: z.number().min(0).max(1_000_000_000),
  qtyPerGuest: z.number().min(0).max(100),
});

export const CostCategoryKeySchema = z.enum(['FOOD', 'DRINKS', 'SOUVENIRS', 'LOGISTICS']);

export const HallStateSchema = z.object({
  hallLengthM: z.number().min(0.1).max(5000),
  hallWidthM: z.number().min(0.1).max(5000),
  hallGuestCount: z.number().int().min(0).max(500_000),
  tableShape: HallTableShapeSchema,
  roundDiameterM: z.number().min(0.1).max(50),
  rectangularTableWidthM: z.number().min(0.1).max(50),
  rectangularTableLengthM: z.number().min(0.1).max(50),
  seatsPerTable: z.number().int().min(4).max(14),
  stageAreaM2: z.number().min(0).max(1_000_000),
  aisleCount: z.number().int().min(0).max(20),
  headTableZone: z.boolean(),
  barBuffetZone: z.boolean(),
  danceFloor: z.boolean(),
});

export const CostStateSchema = z.object({
  costGuestCount: z.number().int().min(0).max(500_000),
  contingencyPercent: z.number().min(0).max(200),
  categories: z.object({
    FOOD: z.array(CostLineItemSchema),
    DRINKS: z.array(CostLineItemSchema),
    SOUVENIRS: z.array(CostLineItemSchema),
    LOGISTICS: z.array(CostLineItemSchema),
  }),
});
