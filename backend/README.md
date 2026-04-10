# Evvnt Backend (Node.js + Express + TypeScript)

This is the backend service for Evvnt MVP.

## Requirements

- Node.js (current repo uses Node 18, but some dev dependencies may warn; Node 20+ recommended)
- PostgreSQL (running locally)

## Setup

```bash
cd backend
cp .env.example .env
npm install
```

## Database

Install and start PostgreSQL locally (for example on macOS: `brew install postgresql@16` and `brew services start postgresql@16`). Create two databases — app and tests:

```bash
createdb evvnt
createdb evvnt_e2e
```

Copy `.env` from `.env.example` and `.env.test` from `.env.test.example`. Point `DATABASE_URL` in `.env` at `evvnt` and in `.env.test` at `evvnt_e2e`; adjust user/password to match your Postgres install.

This repo uses Prisma with SQL migrations under `prisma/migrations/` (including **Event Planner** / `FinanceEntry.metadata` in `20260409100000_add_event_planner_and_finance_metadata`).

With Postgres running, apply migrations to both databases:

```bash
cd backend
npm run db:setup
```

That runs `db:wait` (TCP check using `DATABASE_URL` from `.env`), then `db:migrate` (`.env`) and `db:migrate:test` (`.env.test`). Alternatively: `npx prisma migrate deploy` with `DATABASE_URL` set for each database, or apply the SQL files in `prisma/migrations/` in order.

## Run

```bash
cd backend
npm run dev
```

Health check: `GET http://localhost:4000/health`

## Tests (Vitest)

| Layer | Location | Needs Postgres |
|-------|----------|----------------|
| **Unit** | `test/unit/` | No |
| **Integration** | `test/integration/` | Yes (skipped if DB down) |
| **E2E (HTTP)** | `test/e2e/` | Partial (smoke tests always run) |

```bash
cd backend
cp .env.test.example .env.test
# Ensure DATABASE_URL in .env.test targets evvnt_e2e, then:
npm run db:setup         # if you have not migrated both DBs yet
npm test                 # all tests
npm run test:coverage    # same + v8 coverage → ./coverage/ (lcov, html, json-summary)
npm run test:watch       # watch mode
```

E2E and integration suites reset data with `TRUNCATE` — **use a dedicated test database**.

If Postgres is not running, unit tests and HTTP smoke tests still run; DB-backed cases are **skipped** and a warning is printed.

In CI, fail when the database must be present: `REQUIRE_E2E_DB=1 npm test`.

## Notifications worker (email retries)

Email delivery is stored in the `Notification` table. If SMTP is configured, email notifications are attempted immediately. Failed notifications can be retried by running the worker:

```bash
cd backend
npm run worker:notifications
```

## API Docs

- Human-readable list and full request index: `docs/API.md`
- **Swagger UI:** `http://localhost:4000/api/docs` (with `npm run dev`)
- **OpenAPI JSON:** `http://localhost:4000/api/openapi.json`
- **Postman:** import `docs/postman/Evvnt.postman_collection.json`

