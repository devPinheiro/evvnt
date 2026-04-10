# Technical Architecture Document (TAD) — Evvnt

This document describes the **intended** technical architecture for Evvnt (Nigeria-first MVP), and how it should evolve toward Phase 2–3.

[Back to Architecture index](./README.md) · [Back to repo README](../../README.md)

---

## 1. Goals & Constraints

### 1.1 Product scope (MVP)

MVP modules (from PRD): Event creation, guests, e-invites/RSVP, ticketing/check-in, vendors, finance, gifting, gallery.

### 1.2 Non-functional constraints (from PRD)

- **Performance**: page load < 2.5s on 4G; API p95 < 300ms; QR validation < 1s
- **Availability**: 99.5% (MVP) → 99.9% (Phase 2)
- **Mobile-first**: guest-facing pages usable on low-end Android on 3G
- **Offline**: check-in scanner + guest list offline with sync
- **Security & privacy**: HTTPS; RBAC server-side; no PII in URLs; NDPR compliant; GDPR-ready later

### 1.3 Operating constraints (Nigeria-first)

- Unstable venue connectivity is common; offline-first check-in is non-negotiable.
- Payment reliability requires **dual rails** (Paystack + Flutterwave) plus manual bank transfer reconciliation.
- WhatsApp is a primary distribution channel; native integration can be Phase 2 but share flows must be first-class in MVP.

---

## 2. System Overview (Conceptual)

### 2.1 High-level components

- **Web app (Host/Planner)**: dashboard + module UIs
- **Guest-facing microsites**: event pages, invite pages, ticket purchase, gift page, gallery
- **Scanner PWA**: staff check-in (camera QR scanning), offline cache + sync
- **Backend API**: auth, RBAC, event modules, exports, notifications orchestration
- **Payments**: Paystack + Flutterwave integrations; manual transfer reconciliation tools
- **Media storage**: Cloudinary (images) + object storage for exports/docs (S3-compatible)
- **Notifications**: email + SMS (MVP), WhatsApp (Phase 2)
- **Analytics**: event-level reporting (v1.1+), org-level later

### 2.2 Domain boundaries (suggested)

Evvnt works best when modeled around a central **Event** aggregate with attached subdomains:

- Event Core (identity, status lifecycle, branding, access)
- Guests & RSVP
- Ticketing & Check-in
- Vendors & Tasks
- Finance & Settlement
- Gifting
- Gallery
- Notifications

---

## 3. Tenancy & Identity Model

### 3.1 Tenancy

**Multi-tenant SaaS** where:

- A **User** belongs to an **Organisation** (or is an individual host org-of-one).
- An **Organisation** owns multiple **Events**.
- Access control is enforced at **event scope** (RBAC per event) and **org scope** (billing, team).

### 3.2 Roles (PRD-aligned)

- Owner/Host, Co-host, Event Staff, Vendor, Guest, Planner (Agency)

### 3.3 Authentication (MVP target)

- Email/password
- Google OAuth
- OTP via SMS for guest check-in flows (where required)

---

## 4. Core Data Model (MVP — Draft)

This section defines the minimum set of entities and relationships; it is intentionally incomplete until the implementation starts.

### 4.1 Entities (minimum)

- Organisation
- User
- Event
- EventRole / Membership (user ↔ event, role + per-module permissions)
- Guest
- Invite (per-guest tokenized link) + InviteDelivery (channel logs)
- RSVP (status + form answers)
- TicketTier
- Order + PaymentAttempt + Ticket (QR token)
- CheckIn (audit trail)
- Vendor + VendorEngagement + VendorTask + VendorInvoice + VendorMilestonePayment
- Budget + BudgetCategory + Expense + IncomeEntry
- Gift + GiftPayout
- GalleryAsset + GalleryUpload + GalleryApproval
- Notification (outbox) + Delivery (email/SMS)
- AuditLog (system-wide)

### 4.2 “No PII in URLs” guidance

- Prefer **opaque identifiers** and signed tokens.
- Any guest/vendor access links should use **short-lived** or **revocable** tokens.
- Never embed email/phone in query params or path.

---

## 5. API Architecture (MVP)

This section follows the documentation style used in `node_template_backend` (clean separation, controllers → services → repositories).

### 5.1 Layering (recommended)

- **Controllers**: HTTP boundary; validation; auth context; mapping DTOs
- **Services / Use-cases**: business rules (status transitions, constraints, fee calculations)
- **Repositories**: persistence and queries
- **Integrations**: payment gateways, SMS/email providers, Cloudinary, storage, maps

### 5.2 API versioning

- Use a versioned prefix, e.g. `/api/v1/...`, to keep breaking changes contained.

### 5.3 Key endpoints (outline only)

- Events: create/update/publish/clone/cancel
- Guests: import/dedupe/bulk actions
- Invites & RSVP: send, open tracking, RSVP submit, reminder re-send
- Tickets: tiers, checkout, payment webhook, ticket issuance, refund initiation
- Check-in: validate/scan, offline reconciliation
- Vendors: engagement, tasks, invoices, milestones, payouts
- Finance: budget categories, expenses, income ledger, export
- Gifts: gift page config, gift payment webhook, ledger, payout
- Gallery: uploads, approvals, watermarking, gated access

---

## 6. Payments & Money Flows

### 6.1 Payment rails

- **Primary**: Paystack + Flutterwave (dual rails with fallback)
- **Tertiary**: manual bank transfer + reconciliation UI

### 6.2 Flows

- Ticket purchase (customer → event host wallet)
- Gift payment (guest → gift wallet → payout)
- Vendor settlement (host → vendor, via “Evvnt Pay” abstraction)

### 6.3 Webhooks & idempotency (must-have)

- All provider callbacks must be processed with **idempotency keys** (provider reference + internal paymentAttemptId).
- Never mark tickets/gifts paid from the client callback alone; rely on server-side confirmation.

---

## 7. Offline-First Check-in Architecture (Scanner PWA)

### 7.1 Offline requirements

- Cache **event roster / ticket validation set** locally before doors open.
- Allow scans without network; queue events for sync.
- Reconcile conflicts (duplicate scans) deterministically with server as source of truth.

### 7.2 Suggested approach (MVP)

- Preload a **signed, time-bounded validation bundle** for the event.
- Scan QR → local validation → mark “pending sync” → sync when online.

---

## 8. Media & Storage

- **Cloudinary**: image upload + transformations (covers, gallery)
- **Object storage**: exports (CSV/PDF), contracts, receipts

Watermarking for gallery should be handled either:

- at upload time (store derived assets), or
- at download time (generate derived on demand with caching)

---

## 9. Notifications

### 9.1 MVP channels

- Email (transactional)
- SMS (invites, check-in, receipts, alerts)

### 9.2 Outbox pattern (recommended)

- Write notification intent to DB, then deliver asynchronously.
- Store delivery attempts and provider responses for troubleshooting.

---

## 10. Observability & Audit Trail

### 10.1 Audit logging (from PRD)

All financial transactions and event actions logged with timestamp and actor ID.

Minimum audit events:

- Event created/published/cancelled
- Invite sent/opened
- RSVP submitted/updated
- Order paid/refunded
- Ticket scanned (including duplicates)
- Vendor milestone approved/paid
- Expense created/approved/paid
- Gift received/acknowledged/paid out

### 10.2 Metrics (starter)

- p95 API latency, error rate, webhook failure rate
- check-in validation latency
- payment success rate by rail
- notification delivery success rate

---

## 11. Security

- HTTPS everywhere
- RBAC enforced server-side (event-scoped + module permissions)
- Webhook verification (Paystack/Flutterwave signatures)
- Rate limiting on public endpoints (RSVP, gift page, ticket checkout, gallery)
- Data retention and access controls aligned to NDPR

---

## 12. Deployment & Environments (starter)

Define at minimum:

- **Local** (dev)
- **Staging** (QA + partner beta)
- **Production**

For each environment, document:

- base URLs
- secrets management approach
- migration strategy
- rollback strategy

---

## 13. Architecture Decisions (ADRs)

Track major decisions as ADRs (Architecture Decision Records). Suggested format:

- Context
- Decision
- Alternatives considered
- Consequences

Starter decisions to capture:

- Data store choice(s) for MVP
- Queue/background jobs approach
- Payment abstraction and fallback routing
- Offline check-in sync strategy

---

## 14. Open Questions (to resolve before implementation)

- What is the initial stack baseline (DB, hosting, queue, cache)?
- How will event-level module permissions be represented (bitmask vs table)?
- Ticket validation: do we precompute allowlists or validate online-first with offline fallback?
- How do we reconcile manual bank transfers at scale without creating fraud vectors?

