# PRD v1.1 — What changed (Evvnt)

This note summarises **updates called out in the v1.1 document** relative to a generic “v1.0 MVP” baseline.

## New: Module 09 — Event Planner (MVP scope)

- **Per-event** workspace (sidebar entry in the product UI; API is scoped under `/events/:eventId/planner`).
- **Hall management calculator**
  - Inputs: hall length/width (m), expected guest count, table shape (**round** or **rectangular**), table dimensions, seats/table (4–14), stage area (m²), aisle count (1.5m × hall length each), optional zones (head table 20m², bar 15m², dance floor 25m²).
  - Outputs: total vs usable area, deductions ledger, tables that fit, max seats, m² per guest, **capacity status** (insufficient / tight / adequate / comfortable), suggestions, simplified **floor-plan hints** for canvas (grid + stage box).
  - Rules per PRD: table footprint formulas, stage capped at **80%** of total hall area with warning.
- **Cost estimator**
  - Four categories only: **Food & catering**, **Drinks & bar**, **Souvenirs & aso-ebi**, **Security & logistics**.
  - Line items: unit cost (₦), qty per guest, live subtotals; **contingency %** (default 10%, warn if &gt; 50%).
  - **Lagos per-head benchmark** bands: Budget ₦15–25k, Mid ₦25–50k, Premium ₦50–120k.
  - **Guest count** for cost tab is independent of hall guest count (they may diverge on purpose).
- **Push to budget** → Finance module: creates `EXPENSE` ledger rows tagged in `metadata` (and a separate **contingency** line when applicable).
- **Deferred to Event Planner v1.1 (product roadmap, not this backend slice)**  
  - **Run-of-Show timeline builder**  
  - Full **PDF export** (server can add PDF generation later; client can use snapshot JSON today).

## Roadmap / phrasing tweaks in the PDF

- **Module map** lists **9 MVP modules** including Event Planner; **Analytics** called out as **v1.1**; marketplaces Phase 2+.
- **Phase 1 MVP** month 5 explicitly includes **Event Planner (Hall + Cost)**.
- **Phase 1.1** still lists analytics, WhatsApp, PWA, agency tier, manual bank reconciliation, and **Event Planner v1.1** (timeline).

## Already in broader PRD (not newly implemented in this repo)

- Flutterwave, SMS/WhatsApp, seating visual builder, vendor portal, subscription tiers, etc. remain product targets; **this backend** remains Paystack-first unless/until those integrations are added.

---

*Aligned with backend implementation: `EventPlannerSettings`, `GET/PUT .../planner`, `POST .../planner/push-budget`, `FinanceEntry.metadata`.*
