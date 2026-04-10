# EVVNT — Product Requirements Document (PRD)

**Version**: v1.0 (DRAFT)  
**Launch focus**: Nigeria-first (Phase 1) → Pan-Africa (Phase 2)  
**Target date in doc**: 2025  
**Document owner**: Product Team — Evvnt  

## Table of contents

- [1. Product Overview](#1-product-overview)
  - [1.1 The Problem](#11-the-problem)
  - [1.2 The Opportunity](#12-the-opportunity)
  - [1.3 Value Proposition by User Type](#13-value-proposition-by-user-type)
  - [1.4 Monetisation Model](#14-monetisation-model)
- [2. Platform Architecture & User Roles](#2-platform-architecture--user-roles)
  - [2.1 Platform Architecture Overview](#21-platform-architecture-overview)
  - [2.2 User Roles & Permissions](#22-user-roles--permissions)
- [3. MVP Module Map](#3-mvp-module-map)
- [Module 01 — Event Creation & Management](#module-01--event-creation--management)
- [Module 02 — Guest Management](#module-02--guest-management)
- [Module 03 — E-Invite & RSVP](#module-03--e-invite--rsvp)
- [Module 04 — Ticketing & Check-in](#module-04--ticketing--check-in)
- [Module 05 — Vendor Management](#module-05--vendor-management)
- [Module 06 — Financial Tracking & Bill Settlement](#module-06--financial-tracking--bill-settlement)
- [Module 07 — Cash Gifting to Host](#module-07--cash-gifting-to-host)
- [Module 08 — Event Photo Gallery](#module-08--event-photo-gallery)
- [4. Product Roadmap](#4-product-roadmap)
- [5. Non-Functional Requirements](#5-non-functional-requirements)
- [6. Success Metrics](#6-success-metrics)

---

## 1. Product Overview

Evvnt is a full-stack Event Management Operating System designed for the Nigerian and broader African events market. It gives event planners, individual hosts, corporate teams, and venue owners a single unified platform to plan, execute, monetise, and analyse every dimension of an event — from the first guest invite to the final vendor payment.

The platform is not a standalone ticketing tool or a simple RSVP page. It is an operating layer: every workflow that surrounds an event — vendor sourcing, financial tracking, guest experience, gifting, media — lives and connects inside Evvnt.

### 1.1 The Problem

The Nigerian events industry is large, loud, and almost entirely uncoordinated. Event planners juggle WhatsApp threads, Google Sheets, POS terminals, verbal vendor agreements, and manual guest lists. Money leaks through every seam: uninvoiced vendor extras, unrecorded cash gifts, no-show vendors with partial payments. Hosts have no visibility. Guests have no certainty.

The result: a market with enormous energy and virtually no infrastructure.

### 1.2 The Opportunity

- **Nigeria events market**: Est. ₦4.2 trillion annually (weddings, corporate, social)
- **Formal infrastructure**: < 5% of events use any dedicated management software
- **Target early adopters**: Professional planners, corporate teams (highest willingness to pay)
- **Viral loop**: Every event creates guests — guests become future hosts
- **Expansion path**: Ghana → Kenya → Diaspora (UK, US) in Phase 2–3

### 1.3 Value Proposition by User Type

| User Type | Core Problem Solved | Key Value |
|---|---|---|
| Professional Planner | Juggling multiple client events with no unified system | Multi-event dashboard, client portal, vendor CRM, financial reporting |
| Individual Host | No tool built for Naija social events (owambes, weddings, birthdays) | Guest list, e-invites, cash gifting, photo gallery — all in one |
| Corporate Team | Approval chains, budget tracking, compliance | Budget controls, vendor contracts, post-event reporting |
| Venue Owner | Disconnected from event planners, no booking visibility | Venue listing, integrated booking, capacity management |

### 1.4 Monetisation Model

Evvnt uses a hybrid revenue model: subscription tiers for platform access, plus transaction fees on financial flows.

| Tier | Price | Events/Mo | Includes |
|---|---:|---:|---|
| Starter (Free) | ₦0 | 1 | 1 active event, up to 50 guests, basic ticketing, e-invite |
| Pro | ₦15,000/mo | 5 | Unlimited guests, vendor management, financial tracking, gallery |
| Agency | ₦45,000/mo | Unlimited | Multi-event dashboard, client portal, white-label invites, full analytics |
| Enterprise | Custom | Unlimited | SLA, dedicated support, custom integrations, bulk billing |

**Transaction fees**

- **1.5%** on ticket sales (capped at **₦2,500 per ticket**)
- **1%** on cash gifts received through the platform
- **0.5%** on vendor payments processed through Evvnt Pay

---

## 2. Platform Architecture & User Roles

### 2.1 Platform Architecture Overview

Evvnt is structured as a multi-tenant SaaS platform. Each account belongs to one organisation (or individual host). Within an organisation, multiple users can hold different roles. Events are the central entity — all modules attach to an event.

| Layer | Description |
|---|---|
| Identity & Auth | Email/password + social login (Google). OTP via SMS for guest check-in. Role-based access control (RBAC) per event. |
| Event Entity | Central object. Every module (tickets, guests, vendors, finance, gallery, gifting) is a child of an Event. |
| Payment Infrastructure | Paystack and Flutterwave as dual rails. Automatic fallback. Manual bank transfer as tertiary option with reconciliation tooling. |
| Notification Layer | Email (transactional), SMS, in-app push. WhatsApp integration in Phase 2. |
| Storage | Cloudinary (media/gallery). S3-compatible storage for documents and exports. |
| Analytics Engine | Event-level and org-level reporting. Revenue, attendance, vendor spend, gift totals. |

### 2.2 User Roles & Permissions

| Role | Scope | Key Permissions |
|---|---|---|
| Owner / Host | Full event control | Create/delete event, all module access, financial withdrawal, gift receipt |
| Co-host | Operational | Edit event, manage vendors, view finances (no withdrawal), check-in guests |
| Event Staff | Check-in only | Scan QR codes, mark attendance, view guest list |
| Vendor | Limited portal | View assigned tasks, submit invoices, receive payments |
| Guest | Public-facing | RSVP, purchase tickets, send cash gifts, view event gallery |
| Planner (Agency) | Multi-event | All above across client events, white-label, client reporting |

---

## 3. MVP Module Map

The following modules constitute the v1.0 release.

| # | Module | Core Function | Phase |
|---:|---|---|---|
| 01 | Event Creation & Management | Event setup, branding, scheduling, multi-host configuration | MVP v1 |
| 02 | Guest Management | Guest list CRM, segmentation, RSVP tracking, check-in | MVP v1 |
| 03 | E-Invite & RSVP | Branded digital invites, RSVP flow, WhatsApp share | MVP v1 |
| 04 | Ticketing & Check-in | Ticket tiers, QR code generation, entry scanning | MVP v1 |
| 05 | Vendor Management | Vendor directory, task assignment, contract, payments | MVP v1 |
| 06 | Financial Tracking & Bill Settlement | Budget, expense logging, invoice management, Evvnt Pay | MVP v1 |
| 07 | Cash Gifting to Host | Gift page, payment collection, acknowledgement, payout | MVP v1 |
| 08 | Event Photo Gallery | Upload, curate, share, watermark, gated access | MVP v1 |
| 09 | Analytics & Reporting | Event dashboard, revenue, attendance, vendor spend | v1.1 |
| 10 | Venue Marketplace | Venue listings, booking, capacity, calendar sync | Phase 2 |
| 11 | Vendor Marketplace | Discover, review, book, and pay vendors in-platform | Phase 2 |
| 12 | White-label & Client Portal | Agency-facing client event views, branded exports | Phase 2 |

---

## Module 01 — Event Creation & Management

**Tagline**: The nucleus of every Evvnt workflow

### Purpose

Allow any authorised user to create, configure, brand, and manage events from inception to conclusion. This module is the root entity from which all other modules inherit context.

### User Stories

- As a host, I want to create an event in under 3 minutes so that I can start inviting guests immediately.
- As a planner, I want to manage multiple events simultaneously from one dashboard.
- As a co-host, I want to be added to an event with specific permissions so that I can contribute without full owner access.
- As a host, I want to brand my event with a custom cover photo, colour scheme, and description.
- As a host, I want to set the event as public (ticketed) or private (invite-only).
- As a host, I want to clone a past event as a template for a recurring event.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Clicks “New Event” from dashboard | Opens guided event creation wizard (3-step) | Wizard state initialised |
| 2 | Host | Enters event name, type, date, time, location | Auto-suggests venue if location typed. Validates date is future. | Core event details saved |
| 3 | Host | Uploads cover image, sets colour palette, adds description | Image resized to 1200×628. Generates event microsite URL slug. | Branded event page ready |
| 4 | Host | Sets event visibility (public / private / password-protected) | Configures access control. Password events get a shareable link with token. | Access control applied |
| 5 | Host | Invites co-hosts by email with assigned roles | Sends role-specific invite email. Co-host accepts and is added. | Team configured |
| 6 | Host | Reviews event summary and publishes | Generates event microsite, QR code, unique event ID. | Event LIVE — visible to intended audience |
| 7 | System | Sends host a “Your event is live” confirmation | Email + in-app notification | Host notified. Tracking begins. |

### Functional Requirements

- Event creation wizard: Name, Type (wedding/corporate/birthday/conference/other), Date & Time, Location (or “Online”), Visibility, Cover media.
- Event types pre-populate relevant defaults (e.g. “Wedding” activates Gift module and seating plan prompt).
- Hosts can set a dedicated event URL slug (e.g. `evvnt.ng/my-event-name`).
- Draft state: events can be saved as drafts and published later.
- Clone event: duplicate all settings from a past event, with new date/slug.
- Recurring events: set repeat rules (weekly, monthly) for corporate use.
- Co-host permissions are granular: can toggle access to each sub-module.
- Event status lifecycle: Draft → Published → Ongoing → Ended → Archived.
- Countdown widget auto-generated for embedding in e-invites.

### Edge Cases & Error Handling

- Date in the past: block publish, show clear error with date correction prompt.
- Duplicate slug: auto-append numeric suffix and notify host.
- Image upload failure: allow skip, show placeholder; retry option available.
- Co-host invite to non-existent email: queue invite and notify when user registers.
- Event cancelled: soft-cancel triggers guest notification + automatic refund flow for ticketed events.

---

## Module 02 — Guest Management

**Tagline**: Your full guest list, orchestrated

### Purpose

Provide hosts with a complete CRM for event guests — from initial import through RSVP tracking, segmentation, seating, and post-event follow-up. The guest list is a live, filterable database, not a static spreadsheet.

### User Stories

- As a host, I want to import my guest list from a CSV or Excel file so I don't have to type each name.
- As a host, I want to segment guests into groups (VIP, Family, Work) to manage communications differently.
- As a co-host, I want to see live RSVP status for every guest at any moment.
- As a host, I want to send a reminder to guests who haven't responded.
- As a host, I want to track +1s and table/seating assignments.
- As staff, I want to check in guests at the door using their name or QR code.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Opens Guest module, chooses “Add Guests” | Presents options: Import CSV, Add manually, Sync from contacts | Import method selected |
| 2 | Host | Uploads CSV with guest names, emails, phone numbers | Parses and maps columns. Shows preview. Flags duplicates/missing emails. | Guest list populated — draft state |
| 3 | Host | Assigns guests to groups (VIP, General, Family, Media) | Tags saved. Filter and bulk-action now available by group. | Segmented guest list |
| 4 | Host | Sends e-invite to all or selected groups | Triggers e-invite module. Personalised invite dispatched per guest. | Invites sent. RSVP tracking begins. |
| 5 | Guest | RSVPs via invite link (Yes / No / Maybe) | Status updated in real-time on host dashboard. Confirmation sent to guest. | RSVP recorded |
| 6 | Host | Filters guests by “Not yet responded”, sends reminder | Batch SMS/email reminder dispatched. | Reminder sent. Response rate improves. |
| 7 | Staff | At event entrance, searches guest name or scans QR | Returns guest record. One-tap check-in. Count updates live. | Guest marked “Arrived” |
| 8 | Host | Views live attendance dashboard during event | Real-time count: Invited / RSVP Yes / Arrived / No-show | Full attendance visibility |

### Functional Requirements

- Import: CSV/Excel import with field mapping UI. Accepts: Name, Email, Phone, Group, +1 count, Table number.
- Manual add: individual guest form with optional fields.
- Deduplication: flag duplicate emails/phones before import is confirmed.
- Segmentation: unlimited custom groups per event. Multi-group tagging allowed.
- RSVP status: Not Sent, Invited, RSVP Yes, RSVP No, Awaiting, Arrived, No-show.
- Dietary/accessibility notes field per guest.
- Seating/table assignment with visual table builder (drag-and-drop) in v1.1.
- Bulk actions: send message, change group, delete, export.
- Check-in: QR scan (from e-invite) or manual name search. Offline mode for unstable venue internet.
- Guest count cap per event tier enforced by platform.
- Export: full guest list as CSV/PDF at any time.

### Edge Cases & Error Handling

- Import with missing email: guest added but cannot receive digital invite. Host warned. SMS-only option offered.
- Duplicate guest check-in attempt: system warns staff of duplicate scan, shows original check-in timestamp.
- Over-capacity RSVP: if max capacity set, system closes RSVP and shows waitlist option.
- Offline check-in: staff app caches guest list locally. Syncs when connectivity restored.

---

## Module 03 — E-Invite & RSVP

**Tagline**: Beautiful invitations. Zero paper.

### Purpose

Enable hosts to design, personalise, and distribute digital event invitations that are visually on-brand, mobile-native, shareable on WhatsApp, and connected to a live RSVP system.

### User Stories

- As a host, I want to create a beautiful digital invite using a template so I don't need a designer.
- As a host, I want every invite to be personalised with the guest's name.
- As a host, I want to share invites via WhatsApp, SMS, and email from within the platform.
- As a guest, I want to RSVP in one tap without creating an account.
- As a host, I want a shareable general invite link for social media posting.
- As a host, I want to add dress code, gift registry info, and a location map pin to the invite.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Opens E-invite module, selects template category | Template gallery loads: Wedding, Birthday, Corporate, Owambe, Graduation, Custom | Template selected |
| 2 | Host | Customises template: colours, fonts, images, event details | Live preview renders on mobile and desktop. All event fields auto-fill from Event module. | Invite design finalised |
| 3 | Host | Adds extra invite blocks: Dress Code, Gift Info, Location Map, Programme | Drag-and-drop block builder. Map pin via Google Maps embed. | Rich invite configured |
| 4 | Host | Configures RSVP settings: deadline, +1 allowed, meal choices | RSVP form appended to invite. Deadline enforced at link level. | RSVP gate set |
| 5 | Host | Selects guests and sends via Email / SMS / WhatsApp | Personalised invite dispatched per channel. Each invite has unique guest token. | Invites delivered |
| 6 | Guest | Opens invite link, sees personalised invite | Renders invite microsite. Guest name pulled from token. No login required. | Guest views invite |
| 7 | Guest | Taps RSVP button, selects Yes/No, optionally adds +1 / meal pref | RSVP recorded. Guest receives confirmation. Host dashboard updates live. | RSVP confirmed |
| 8 | Host | Shares general invite link to Instagram Stories, Twitter | Generates a public invite link without personalisation. RSVP collects name + contact. | Open invite distributed |

### Functional Requirements

- Template library: minimum 20 templates across 6 categories at launch. Templates fully customisable.
- Brand kit: hosts can save a brand kit (logo, colours, fonts) for reuse across events.
- Personalisation tokens: `{{guest_name}}`, `{{event_name}}`, `{{date}}`, `{{dress_code}}` etc.
- Invite blocks: Hero image, Event details, Programme, Dress code, Gift note, Map pin, RSVP form, Social links.
- Channels: Email (HTML), SMS (link), WhatsApp (pre-formatted message with link), Copy link.
- RSVP form: Yes / No / Maybe. Optional: +1 count, meal preference, dietary restriction.
- RSVP deadline: auto-closes form and shows “RSVP closed” message after deadline.
- Waitlist: when RSVP limit reached, guests added to waitlist and notified if space opens.
- General invite link: shareable without personalisation. Collects guest info on RSVP.
- Invite analytics: open rate, RSVP rate, channel breakdown.
- Re-send to non-openers: filter by “Invite sent, not opened” and re-dispatch.

### Edge Cases & Error Handling

- SMS delivery failure: log failure, flag on dashboard, allow retry or alternate channel.
- Guest RSVPs multiple times via different links: deduplicate by email/phone, keep latest response.
- Template render on low-end Android browser: progressive enhancement; CSS-only fallback with no JS dependency.
- WhatsApp share blocked (some browsers): fallback to “Copy invite text” button.

---

## Module 04 — Ticketing & Check-in

**Tagline**: Sell access. Control entry. Close the loop.

### Purpose

Enable hosts to create and sell multiple ticket tiers for public or semi-public events. Handle payment via Paystack or Flutterwave, generate unique QR-coded tickets, and provide staff with a real-time check-in scanner.

### User Stories

- As a host, I want to create multiple ticket tiers (Early Bird, Regular, VIP) with different prices and quantities.
- As a host, I want ticket sales to automatically close when sold out or after a deadline.
- As a guest, I want to buy a ticket and receive it instantly on my phone.
- As a host, I want to see real-time sales data and revenue.
- As staff, I want to scan QR codes at the entrance to validate tickets instantly.
- As a host, I want to issue complimentary (free) tickets to specific guests.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Opens Ticketing module, clicks “Create Ticket Tier” | Tier form opens: Name, Description, Price, Quantity, Sale start/end date, Perks | Ticket tier configured |
| 2 | Host | Sets payment: Paystack / Flutterwave / Free | Links to host's verified payment account. Configures Evvnt 1.5% fee. | Payment rail active |
| 3 | Host | Publishes event — ticket widget goes live on event page | Ticket purchase widget embedded in event microsite. | Tickets on sale |
| 4 | Guest | Visits event page, selects ticket tier and quantity | Real-time availability check. Adds to cart. | Cart populated |
| 5 | Guest | Enters contact details, proceeds to payment | Paystack/Flutterwave checkout opens. Accepts card, USSD, bank transfer. | Payment initiated |
| 6 | System | Payment confirmed | Generates unique QR ticket(s). Sends to guest via email + SMS. Records sale. | Ticket delivered to guest |
| 7 | Staff | At event door, opens scanner app on phone | Camera activates. Scans guest QR code. | Validation response in < 1 second |
| 8 | System | Validates ticket | Checks: valid event ID, correct date, not already scanned, not cancelled. Returns green (valid) or red (invalid/used). | Guest admitted or denied |
| 9 | Host | Monitors live sales and check-in count on dashboard | Real-time counters: Tickets sold, Revenue collected, Guests checked in, Capacity remaining. | Full event visibility |

### Functional Requirements

- Ticket tiers: unlimited tiers. Each tier: name, description, price (₦ or free), quantity limit, sale window, per-order limit.
- Promo codes: percentage or fixed discount. Usage limit, expiry, per-user limit.
- Complimentary tickets: issue free tickets to named guests with no payment flow.
- Payment: Paystack and Flutterwave as parallel rails. Auto-route based on availability. Accepts: card, bank transfer, USSD.
- Manual bank transfer: host marks payment as confirmed manually; ticket issued.
- Ticket format: PDF + mobile-optimised HTML. QR code unique per ticket.
- Order confirmation: instant email + SMS to buyer.
- Resale: configurable by host — allow or block ticket transfer.
- Refunds: automated refund initiation (subject to host refund policy settings).
- Scanner app: web-based PWA (works on any smartphone). Offline mode with sync.
- Group check-in: bulk scan for group tickets purchased in one order.
- Revenue payout: settled to host wallet within 24h of event end (subject to Paystack/Flutterwave settlement cycles).

### Edge Cases & Error Handling

- Payment fails mid-checkout: no ticket issued. Cart held for 10 minutes. Clear error with retry option.
- Ticket tier sells out during checkout: notify buyer before payment is taken. Offer alternative tier.
- QR code screenshot shared with multiple people: each QR tied to one admission. Subsequent scans flagged as “Already Used”.
- Scanner offline: cached validation for pre-loaded guest QR list. Flags for post-event reconciliation.
- Chargebacks: host notified. Evvnt support workflow initiated. Ticket invalidated pending resolution.

---

## Module 05 — Vendor Management

**Tagline**: Every vendor, every task, every payment — in one place.

### Purpose

Give hosts and planners a structured system to source, onboard, assign, track, and pay vendors. Replace WhatsApp negotiations and verbal agreements with a documented, accountable vendor workflow.

### User Stories

- As a host, I want to add vendors to my event with their service type, agreed fee, and payment schedule.
- As a planner, I want to send vendors a brief/task list directly from the platform.
- As a vendor, I want to receive and accept my engagement, see my tasks, and submit invoices.
- As a host, I want to set milestone payments (deposit + balance) and track whether each has been paid.
- As a host, I want to rate vendors after the event to build a reputation record.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Opens Vendor module, clicks “Add Vendor” | Form: Vendor name, service type, email/phone, agreed total fee | Vendor record created |
| 2 | Host | Defines payment schedule: e.g. 50% deposit now, 50% on event day | Payment milestones created. Linked to Evvnt Pay or manual. | Payment schedule set |
| 3 | Host | Sends vendor an engagement notification | Email with event brief, their tasks, fee summary, payment schedule. Vendor portal link included. | Vendor onboarded |
| 4 | Vendor | Opens vendor portal, reviews engagement details, accepts | Acceptance logged with timestamp. Host notified. | Vendor confirmed |
| 5 | Host | Assigns tasks to vendor | Tasks created with due time. Vendor sees tasks in their portal. | Tasks assigned |
| 6 | Vendor | Marks tasks complete, uploads delivery photos | Task status updated. Host notified. Photo stored in event record. | Deliverables documented |
| 7 | Host | Approves deposit milestone, triggers payment via Evvnt Pay | Payment initiated via Paystack/Flutterwave to vendor bank account. | Deposit paid. Logged in Finance module. |
| 8 | Vendor | After event, submits final invoice for balance payment | Invoice appears in host Finance module for approval. | Invoice pending approval |
| 9 | Host | Approves invoice, releases final payment | Final payment processed. Vendor notified. Record closed. | Vendor fully settled |
| 10 | Host | Rates vendor: 1–5 stars with comment | Rating stored on vendor profile (future marketplace use). | Vendor reputation recorded |

### Functional Requirements

- Vendor types: Catering, Decoration, Photography, Videography, DJ/Music, MC, Security, Transport, Venue, Print, Other.
- Vendor portal: lightweight web interface (no app install). Access via unique link. No Evvnt account required for vendor.
- Engagement document: auto-generated summary of agreed services, fee, and schedule. Downloadable as PDF.
- Task management: create tasks with description, assigned vendor, due date/time, delivery requirement (upload).
- Payment milestones: up to 5 milestones per vendor. Each can be Evvnt Pay or Manual (with confirmation upload).
- Vendor communication: in-platform messaging thread per vendor (stored). Email fallback.
- Multi-vendor view: all vendors for an event in one table with status (Pending, Confirmed, Paid, Completed).
- Spend summary: total committed vendor spend vs paid vs outstanding. Feeds Finance module.
- Vendor ratings: 1–5 stars. Stored for future Vendor Marketplace.

### Edge Cases & Error Handling

- Vendor doesn't accept invite: follow-up reminder at 24h and 48h. Host notified at 72h for manual follow-up.
- Task not completed before event: host can override task status and log a note. Affects vendor rating.
- Payment to wrong bank account: Evvnt does not store bank details; payment goes through Paystack/Flutterwave recipient creation — vendor verifies own details.
- Vendor disputes payment: dispute flag opens a resolution thread. Evvnt support mediates for Evvnt Pay transactions.

---

## Module 06 — Financial Tracking & Bill Settlement

**Tagline**: Every naira in. Every naira out. No surprises.

### Purpose

Give hosts a real-time event budget and financial management system. Track all income (tickets, gifts) and expenses (vendors, venue, logistics), log bills, flag overruns, and settle outstanding payments — all within Evvnt.

### User Stories

- As a host, I want to set a total event budget and see how much I've committed vs spent in real time.
- As a planner, I want to log expenses against budget categories as they are incurred.
- As a corporate user, I want an approval workflow before any expense is committed.
- As a host, I want to see a full income summary: ticket revenue, gifts received, sponsorships.
- As a host, I want to export a complete financial report for a post-event debrief or accounting.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Opens Finance module, sets total event budget | Budget record created. Categories auto-generated from event type. | Budget configured |
| 2 | Host | Allocates budget to each category | Category budgets saved. Total allocation vs budget shown live. | Budget breakdown set |
| 3 | System | Vendor payments from Vendor module auto-post to Finance | Each vendor payment creates an expense entry under the correct category. | Expenses auto-logged |
| 4 | Host | Manually logs ad hoc expense | Expense form: Category, Amount, Description, Date, Receipt upload. | Expense recorded |
| 5 | System | Ticket sales and gift income auto-post to Finance income ledger | Income entries created per payment received. | Income tracked in real-time |
| 6 | Host | Views live financial dashboard | Renders live chart. Shows overrun warnings (>90% of category budget). | Full financial picture visible |
| 7 | Host | Settles outstanding vendor bills | Bill status updated. Finance ledger reconciled. | Bills settled. Ledger clean. |
| 8 | Host | Exports financial report post-event | Generates PDF and Excel export. | Report downloaded |

### Functional Requirements

- Budget: set at event level. Per-category allocation. Warning at 90%, alert at 100%.
- Expense categories: Venue, Catering & Bar, Decoration, Entertainment/DJ/MC, Photography/Video, Security, Transport, Print & Stationery, Gifts & Souvenirs, Miscellaneous.
- Income sources: Ticket revenue (auto), Cash gifts (auto), Sponsorship (manual log), Other (manual).
- Expense entry: amount, category, vendor (linked or free text), date, description, receipt photo upload.
- Bill settlement: mark any expense as “Pending Payment” — one-click pay via Evvnt Pay or mark as “Paid Manually” with upload.
- Corporate approval flow: expenses above a threshold require Finance Approver sign-off before payment.
- Multi-currency: NGN primary. USD/GBP for diaspora events in Phase 2.
- Reconciliation: side-by-side view of Evvnt Pay transactions vs manually logged payments.
- Export: PDF summary report + Excel raw data. Both post-event and in-flight.
- Accountant view: read-only finance portal for external accountant access (Agency tier).

### Edge Cases & Error Handling

- Budget overrun: warn at 90% of any category. Block or require override at 100% (configurable).
- Duplicate expense entry: flag duplicate amount + date + category combinations for host review.
- Evvnt Pay transaction fails: expense remains “Pending”. Host notified. Retry option shown.
- Missing receipt for corporate expense: flag for Finance Approver. Block approval until uploaded.

---

## Module 07 — Cash Gifting to Host

**Tagline**: The Naija gift tradition, digitised.

### Purpose

Enable guests to send monetary gifts directly to event hosts via a dedicated, branded gifting page — the digital evolution of the Nigerian “spraying” and “aso-ebi” cash gift culture. Hosts receive a consolidated payout. Every gift is acknowledged.

### User Stories

- As a host, I want a dedicated gift link I can share with guests so they can send money instead of or in addition to physical gifts.
- As a guest, I want to send a gift easily from my phone without creating an account.
- As a guest, I want to optionally attach a personalised message to my gift.
- As a host, I want to see all gifts received in real time, with sender names and messages.
- As a host, I want to send an acknowledgement/thank-you to each guest who gifted.
- As a host, I want my gift funds consolidated and paid out to my bank account after the event.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Opens Gifting module, enables Gift Page for event | Generates branded gift page at `evvnt.ng/gift/[event-slug]` | Gift page live |
| 2 | Host | Customises gift page | Page preview shown. Suggested amounts displayed as quick-tap buttons. | Gift page configured |
| 3 | Host | Shares gift link | Share options: copy link, WhatsApp share, embed in e-invite toggle. | Link distributed |
| 4 | Guest | Opens gift link | Renders gift page. Shows event name, host name, suggested amounts. | Guest views gift page |
| 5 | Guest | Enters gift amount, message (optional), name | Amount validation (min ₦500). Message capped at 280 characters. | Gift details entered |
| 6 | Guest | Pays via Paystack/Flutterwave | Payment processed. Platform takes 1% fee. Rest credited to host gift wallet. | Gift payment confirmed |
| 7 | System | Notifies host of new gift | In-app notification + email. | Host notified instantly |
| 8 | Guest | Receives payment confirmation | Confirmation screen with host's thank-you message. Shareable e-receipt. | Guest experience complete |
| 9 | Host | Views gift log | Gift ledger with totals. Filter by date, amount, sender. Download as CSV. | Full gift visibility |
| 10 | Host | Sends thank-you acknowledgements | Pre-drafted thank-you template with personalisation. Sent via email/SMS. | Guests acknowledged |
| 11 | Host | Requests payout post-event | Initiates payout via Paystack/Flutterwave. Settled within 24–48h. | Gift funds in host's account |

### Functional Requirements

- Gift page: event photo, host name/photo, personalised message, suggested amounts (3 options), custom amount input.
- Minimum gift: ₦500. Maximum: ₦500,000 per transaction (Paystack limit).
- Anonymity option: guest can choose to gift anonymously (shows “A well-wisher”).
- Gift message: 280 characters. Stored against gift record.
- Group gift: multiple guests can contribute to a single named gift (Phase 2).
- Gift ledger: real-time list of all gifts. Total, average gift size, top contributors.
- Acknowledgement: host sends thank-you via email/SMS. Templates provided. Personalisation with sender name and amount.
- Payout: host requests payout from gift wallet after event ends. Minimum payout ₦1,000.
- Fee transparency: 1% Evvnt fee shown to guest before payment confirmation.

### Edge Cases & Error Handling

- Payment fails: guest shown clear error. Gift not recorded. Retry option immediately available.
- Guest sends gift to wrong event: Evvnt support process for refund within 24h of payment.
- Host requests payout before event ends: allowed but flagged. Chargebacks post-payout are host's responsibility.
- High volume gifting (celebrity/viral event): auto-scaling on Paystack/Flutterwave side. Evvnt gift log paginated for performance.

---

## Module 08 — Event Photo Gallery

**Tagline**: Every memory, curated and shared.

### Purpose

Provide a managed, branded photo gallery for each event — where the host, photographers, and guests can upload photos, the host can curate what's shared, and guests can view and download memories in a gated or open environment.

### User Stories

- As a photographer vendor, I want to upload event photos directly to the Evvnt gallery from my phone or laptop.
- As a host, I want to review uploads and approve which photos appear in the guest-facing gallery.
- As a guest, I want to view event photos and download my favourites without needing an app.
- As a host, I want to enable guest uploads so guests can contribute their own candid shots.
- As a host, I want all gallery photos to have a subtle watermark with the event name.
- As a host, I want to share the gallery link easily after the event.

### End-to-End User Journey

| # | Actor | Action | System Response | Output / State |
|---:|---|---|---|---|
| 1 | Host | Opens Gallery module, configures settings | Options: Guest upload, Approval required, Watermark, Gallery visibility | Gallery configured |
| 2 | Photographer | Uploads event photos | Bulk upload supported. Photos queued for review if approval required. | Photos uploaded |
| 3 | Host | Reviews uploads | Grid view with approve/reject per photo or batch-approve. | Approved photos in public gallery |
| 4 | Guest | Receives gallery link | Opens gallery microsite. No login required if set to guests-only with token. | Guest views gallery |
| 5 | Guest | Downloads photo | Watermarked version served on download. Full-res available if host enables. | Photo downloaded |
| 6 | Guest | Uploads candid photo (if enabled) | Upload queued. Approval flow if moderation is on. | Guest contribution added |
| 7 | Host | Shares gallery link | Shareable URL with optional password. | Gallery distributed |

### Functional Requirements

- Upload: drag-and-drop bulk upload on web. Mobile-optimised single upload on app. Max 50MB per photo. JPEG, PNG, HEIC supported.
- Storage: Cloudinary with automatic compression and format optimisation. Originals stored separately.
- Watermark: event name and date auto-applied. Position configurable (corner). Opacity adjustable.
- Approval queue: host sees all uploads in review state. Approve individually or select-all.
- Gallery views: grid, masonry, slideshow. Mobile-first.
- Download: watermarked version free. Full-res downloadable if host enables (Pro+ only).
- Guest upload: enabled/disabled toggle. All guest uploads go through approval if moderation is on.
- Access control: public, guest-only (token), password-protected.
- Gallery analytics: view count, download count, most-viewed photos.
- Photo limit: Starter: 200 photos. Pro: 2,000. Agency: 10,000.
- Archive: gallery remains accessible for 12 months post-event. Archiveable to host cloud storage.

### Edge Cases & Error Handling

- Upload fails mid-batch: completed files saved. Failed files shown with retry option. Host notified.
- Photo contains inappropriate content: host moderation prevents any photo from going live without approval. Report mechanism for guests.
- Watermark on dark image (unreadable): auto-detect dominant colour and switch watermark to contrasting version.
- Gallery link shared beyond intended audience: host can invalidate current link and generate new one.

---

## 4. Product Roadmap

### 4.1 Phase Overview

| Phase | Timeline | Theme | Key Deliverables |
|---|---|---|---|
| Phase 0 | Months 1–2 | Foundation & Design | Design system, component library, brand identity, tech stack setup, auth, event creation core |
| Phase 1 (MVP) | Months 3–6 | Ship the OS | All 8 MVP modules live. Paystack + Flutterwave. Beta with 50 planner partners in Lagos/Abuja. |
| Phase 1.1 | Months 7–8 | Close the Gaps | Analytics dashboard, seating plan builder, WhatsApp notifications, mobile PWA optimisation |
| Phase 2 | Months 9–14 | Marketplace & Growth | Venue Marketplace, Vendor Marketplace, White-label/Agency Portal, Referral programme |
| Phase 3 | Months 15–24 | Pan-African Expansion | Ghana, Kenya, Diaspora (UK/US). Multi-currency. Additional payment rails. Mobile apps (iOS + Android). |

### 4.2 Phase 0: Foundation (Months 1–2)

- Define and finalise brand identity: name, logo, colour system, typography
- Build design system in Figma: tokens, components, patterns
- Technical architecture decision: stack, infrastructure, CI/CD pipeline
- Set up authentication: email/password, Google OAuth, RBAC scaffolding
- Build Event Creation module (core entity)
- Establish beta planner partnership programme (target: 50 planners)

### 4.3 Phase 1: MVP (Months 3–6)

- Month 3: Guest Management + E-Invite + RSVP
- Month 4: Ticketing (Paystack + Flutterwave) + Check-in scanner PWA
- Month 5: Vendor Management + Financial Tracking
- Month 6: Cash Gifting + Photo Gallery + Beta launch with partner planners

### 4.4 Phase 1.1: Close the Gaps (Months 7–8)

- Event analytics dashboard (attendance, revenue, vendor spend)
- Seating plan builder (drag-and-drop table layout)
- WhatsApp notification integration
- Mobile performance audit and PWA enhancements
- Agency tier launch (multi-event dashboard, white-label invites)
- Manual bank transfer reconciliation tooling

### 4.5 Phase 2: Marketplace (Months 9–14)

- Venue Marketplace: browse, book, and pay for venues in-platform
- Vendor Marketplace: discover and book verified vendors by category and rating
- Client Portal: agency-managed client event view (white-label)
- Group gifting (multiple contributors to one named gift)
- Referral programme: host earns credit for every new host they refer

### 4.6 Phase 3: Pan-African (Months 15–24)

- Market entry: Ghana (first), Kenya (second)
- Diaspora events: UK, Canada, US — NGN + GBP/USD/CAD
- Native iOS and Android apps
- Additional payment rails per market (Mobile money: M-Pesa, MTN MoMo)
- Enterprise tier: custom SLA, dedicated support, on-premise reporting

---

## 5. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Performance | Page load < 2.5s on 4G. API response < 300ms p95. QR scan validation < 1s. |
| Availability | 99.5% uptime SLA (MVP). 99.9% target from Phase 2. |
| Scalability | Support up to 10,000 concurrent users at launch. Auto-scale for viral events. |
| Security | HTTPS everywhere. PCI DSS compliance delegated to Paystack/Flutterwave. RBAC enforced server-side. No PII in URLs. |
| Data Privacy | NDPR (Nigeria Data Protection Regulation) compliant. GDPR-ready for Phase 3. |
| Mobile-first | All guest-facing pages must be fully functional on a ₦30,000 Android device on 3G. |
| Offline capability | Check-in scanner and guest list work offline with sync on reconnect. |
| Accessibility | WCAG 2.1 AA for all host and guest interfaces. |
| Localisation | English at launch. Pidgin-friendly UX copy. Yoruba/Hausa/Igbo in Phase 2. |
| Audit trail | All financial transactions and event actions logged with timestamp and actor ID. |

---

## 6. Success Metrics

| Metric | MVP Target (Month 6) | Definition |
|---|---:|---|
| Active Events | 500 | Events created and published in the past 30 days |
| Registered Hosts | 2,000 | Accounts with at least 1 created event |
| Tickets Sold (GMV) | ₦50M | Gross value of tickets transacted through Evvnt |
| Gift Volume | ₦20M | Total cash gifts processed |
| Planner Accounts | 200 | Agency/Professional tier accounts |
| RSVP Conversion | > 60% | % of invited guests who RSVP yes |
| Vendor Payments via Evvnt Pay | > 40% | % of vendor payments processed in-platform (not manual) |
| NPS | > 50 | Net Promoter Score from post-event host survey |
| Guest Return Rate | > 25% | % of guests who attend another Evvnt-powered event |

---

**End of Document — Evvnt PRD v1.0**  
Next: Design System & Moodboard · Module Wireframes · Technical Architecture Document

