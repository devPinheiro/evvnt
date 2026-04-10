-- Ticketing + Check-in core tables

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketOrderStatus') THEN
    CREATE TYPE "public"."TicketOrderStatus" AS ENUM ('INITIATED', 'PAID', 'CANCELLED', 'REFUNDED');
  END IF;
END$$;

CREATE TABLE "public"."TicketTier" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceNgn" INTEGER NOT NULL,
  "quantityTotal" INTEGER NOT NULL,
  "quantitySold" INTEGER NOT NULL DEFAULT 0,
  "saleStartsAt" TIMESTAMP(3),
  "saleEndsAt" TIMESTAMP(3),
  "perOrderLimit" INTEGER NOT NULL DEFAULT 10,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TicketTier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketTier_eventId_createdAt_idx" ON "public"."TicketTier"("eventId", "createdAt");

ALTER TABLE "public"."TicketTier"
ADD CONSTRAINT "TicketTier_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."TicketOrder" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ticketTierId" TEXT NOT NULL,
  "buyerEmail" TEXT,
  "buyerPhone" TEXT,
  "quantity" INTEGER NOT NULL,
  "amountNgn" INTEGER NOT NULL,
  "paystackRef" TEXT,
  "status" "public"."TicketOrderStatus" NOT NULL DEFAULT 'INITIATED',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TicketOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TicketOrder_paystackRef_key" ON "public"."TicketOrder"("paystackRef");
CREATE INDEX "TicketOrder_eventId_createdAt_idx" ON "public"."TicketOrder"("eventId", "createdAt");

ALTER TABLE "public"."TicketOrder"
ADD CONSTRAINT "TicketOrder_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."TicketOrder"
ADD CONSTRAINT "TicketOrder_ticketTierId_fkey"
FOREIGN KEY ("ticketTierId") REFERENCES "public"."TicketTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."Ticket" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "qrToken" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ticket_qrToken_key" ON "public"."Ticket"("qrToken");
CREATE INDEX "Ticket_eventId_issuedAt_idx" ON "public"."Ticket"("eventId", "issuedAt");

ALTER TABLE "public"."Ticket"
ADD CONSTRAINT "Ticket_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Ticket"
ADD CONSTRAINT "Ticket_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "public"."TicketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."CheckIn" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "scannedByUserId" TEXT,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckIn_ticketId_key" ON "public"."CheckIn"("ticketId");
CREATE INDEX "CheckIn_eventId_scannedAt_idx" ON "public"."CheckIn"("eventId", "scannedAt");

ALTER TABLE "public"."CheckIn"
ADD CONSTRAINT "CheckIn_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."CheckIn"
ADD CONSTRAINT "CheckIn_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."CheckIn"
ADD CONSTRAINT "CheckIn_scannedByUserId_fkey"
FOREIGN KEY ("scannedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

