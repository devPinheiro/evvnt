# Evvnt Backend API (MVP)

Base URL (local): `http://localhost:4000`

## OpenAPI & tooling

- **Swagger UI:** `GET /api/docs` (interactive docs while the server is running)
- **OpenAPI JSON:** `GET /api/openapi.json` (machine-readable spec; import into Postman via *Import → Link* or paste URL)
- **Postman collection (checked in):** `docs/postman/Evvnt.postman_collection.json` — Import in Postman (*File → Import*). Set collection variables `baseUrl`, `accessToken`, and optional `eventId`, `guestId`, `vendorId`, `assetId`, `rsvpToken`.

Authenticated routes expect header: `Authorization: Bearer <accessToken>`.

## All HTTP requests (45)

| # | Method | Path |
|---|--------|------|
| 1 | GET | `/health` |
| 2 | POST | `/api/v1/auth/signup` |
| 3 | POST | `/api/v1/auth/login` |
| 4 | POST | `/api/v1/auth/refresh` |
| 5 | POST | `/api/v1/auth/logout` |
| 6 | GET | `/api/v1/auth/me` |
| 7 | GET | `/api/v1/events` |
| 8 | POST | `/api/v1/events` |
| 9 | GET | `/api/v1/events/:eventId` |
| 10 | PUT | `/api/v1/events/:eventId` |
| 11 | POST | `/api/v1/events/:eventId/publish` |
| 12 | POST | `/api/v1/events/:eventId/cancel` |
| 13 | POST | `/api/v1/events/:eventId/clone` |
| 14 | GET | `/api/v1/events/:eventId/guests` |
| 15 | POST | `/api/v1/events/:eventId/guests` |
| 16 | POST | `/api/v1/events/:eventId/guests/dedupe-preview` |
| 17 | POST | `/api/v1/events/:eventId/guests/:guestId/invite` |
| 18 | POST | `/api/v1/events/:eventId/guests/invite-link` |
| 19 | POST | `/api/v1/rsvp/:token` |
| 20 | POST | `/api/v1/payments/paystack/webhook` |
| 21 | POST | `/api/v1/events/:eventId/ticketing/checkout` |
| 22 | GET | `/api/v1/events/:eventId/ticketing/tiers` |
| 23 | POST | `/api/v1/events/:eventId/ticketing/tiers` |
| 24 | POST | `/api/v1/events/:eventId/ticketing/scan` |
| 25 | GET | `/api/v1/events/:eventId/ticketing/offline-bundle` |
| 26 | GET | `/api/v1/events/:eventId/vendors` |
| 27 | POST | `/api/v1/events/:eventId/vendors` |
| 28 | POST | `/api/v1/events/:eventId/vendors/:vendorId/tasks` |
| 29 | POST | `/api/v1/events/:eventId/vendors/:vendorId/milestones` |
| 30 | POST | `/api/v1/events/:eventId/vendors/:vendorId/invoices` |
| 31 | GET | `/api/v1/events/:eventId/finance/ledger` |
| 32 | POST | `/api/v1/events/:eventId/finance/expense` |
| 33 | GET | `/api/v1/events/:eventId/planner` |
| 34 | PUT | `/api/v1/events/:eventId/planner` |
| 35 | POST | `/api/v1/events/:eventId/planner/push-budget` |
| 36 | POST | `/api/v1/events/:eventId/gifts/checkout` |
| 37 | PUT | `/api/v1/events/:eventId/gifts/settings` |
| 38 | GET | `/api/v1/events/:eventId/gifts/ledger` |
| 39 | POST | `/api/v1/events/:eventId/gifts/payouts` |
| 40 | PUT | `/api/v1/events/:eventId/gallery/settings` |
| 41 | POST | `/api/v1/events/:eventId/gallery/assets` |
| 42 | POST | `/api/v1/events/:eventId/gallery/assets/:assetId/approve` |
| 43 | GET | `/api/v1/events/:eventId/gallery/assets` |
| 44 | GET | `/api/v1/notifications` |
| 45 | POST | `/api/v1/notifications/mark-read` |

## Health

- `GET /health`

## Auth

- `POST /api/v1/auth/signup` — creates an organisation and first user; **email must be globally unique**.
- `POST /api/v1/auth/login` — **email + password** (no organisation id).
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Events

- `GET /api/v1/events`
- `POST /api/v1/events`
- `GET /api/v1/events/:eventId`
- `PUT /api/v1/events/:eventId`
- `POST /api/v1/events/:eventId/publish`
- `POST /api/v1/events/:eventId/cancel`
- `POST /api/v1/events/:eventId/clone`

## Guests / Invites / RSVP

- `GET /api/v1/events/:eventId/guests`
- `POST /api/v1/events/:eventId/guests`
- `POST /api/v1/events/:eventId/guests/dedupe-preview`
- `POST /api/v1/events/:eventId/guests/:guestId/invite`
- `POST /api/v1/events/:eventId/guests/invite-link`
- `POST /api/v1/rsvp/:token` (public)

## Payments (Paystack)

- `POST /api/v1/payments/paystack/webhook` (public webhook; requires `x-paystack-signature`)

## Ticketing & Check-in

- `GET /api/v1/events/:eventId/ticketing/tiers` (auth)
- `POST /api/v1/events/:eventId/ticketing/tiers` (auth)
- `POST /api/v1/events/:eventId/ticketing/checkout` (public)
- `POST /api/v1/events/:eventId/ticketing/scan` (auth; staff)
- `GET /api/v1/events/:eventId/ticketing/offline-bundle` (auth; staff)

## Vendors

- `GET /api/v1/events/:eventId/vendors`
- `POST /api/v1/events/:eventId/vendors`
- `POST /api/v1/events/:eventId/vendors/:vendorId/tasks`
- `POST /api/v1/events/:eventId/vendors/:vendorId/milestones`
- `POST /api/v1/events/:eventId/vendors/:vendorId/invoices`

## Finance

- `GET /api/v1/events/:eventId/finance/ledger`
- `POST /api/v1/events/:eventId/finance/expense`

## Event Planner (Module 09 — PRD v1.1)

- `GET /api/v1/events/:eventId/planner` (auth; OWNER / CO_HOST) — saved state + computed hall KPIs, cost totals, Lagos benchmark
- `PUT /api/v1/events/:eventId/planner` (auth; OWNER / CO_HOST) — body: `{ hallState, costState }` (see OpenAPI / implementation types)
- `POST /api/v1/events/:eventId/planner/push-budget` (auth; OWNER / CO_HOST) — body: `{ mode?: "merge" | "replace" }`; writes `FinanceEntry` rows with `metadata.source = "planner_budget"` (category lines + contingency line)

## Gifts

- `POST /api/v1/events/:eventId/gifts/checkout` (public)
- `PUT /api/v1/events/:eventId/gifts/settings` (auth)
- `GET /api/v1/events/:eventId/gifts/ledger` (auth)
- `POST /api/v1/events/:eventId/gifts/payouts` (auth; owner)

## Gallery

- `PUT /api/v1/events/:eventId/gallery/settings` (auth)
- `POST /api/v1/events/:eventId/gallery/assets` (auth)
- `POST /api/v1/events/:eventId/gallery/assets/:assetId/approve` (auth)
- `GET /api/v1/events/:eventId/gallery/assets` (auth)

## Notifications

- `GET /api/v1/notifications` (auth)
- `POST /api/v1/notifications/mark-read` (auth)

