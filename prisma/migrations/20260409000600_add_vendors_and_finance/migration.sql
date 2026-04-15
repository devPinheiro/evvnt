-- Vendors + Finance ledger (MVP)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorType') THEN
    CREATE TYPE "public"."VendorType" AS ENUM (
      'CATERING',
      'DECORATION',
      'PHOTOGRAPHY',
      'VIDEOGRAPHY',
      'DJ_MUSIC',
      'MC',
      'SECURITY',
      'TRANSPORT',
      'VENUE',
      'PRINT',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorEngagementStatus') THEN
    CREATE TYPE "public"."VendorEngagementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorInvoiceStatus') THEN
    CREATE TYPE "public"."VendorInvoiceStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'PAID', 'REJECTED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinanceEntryType') THEN
    CREATE TYPE "public"."FinanceEntryType" AS ENUM ('INCOME', 'EXPENSE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinanceStatus') THEN
    CREATE TYPE "public"."FinanceStatus" AS ENUM ('LOGGED', 'PENDING_PAYMENT', 'PAID_MANUAL', 'PAID_PAYSTACK');
  END IF;
END$$;

CREATE TABLE "public"."Vendor" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "public"."VendorType" NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "agreedFeeNgn" INTEGER NOT NULL,
  "status" "public"."VendorEngagementStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Vendor_eventId_createdAt_idx" ON "public"."Vendor"("eventId", "createdAt");

ALTER TABLE "public"."Vendor"
ADD CONSTRAINT "Vendor_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."VendorTask" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueAt" TIMESTAMP(3),
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorTask_vendorId_createdAt_idx" ON "public"."VendorTask"("vendorId", "createdAt");

ALTER TABLE "public"."VendorTask"
ADD CONSTRAINT "VendorTask_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."VendorMilestone" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amountNgn" INTEGER NOT NULL,
  "dueAt" TIMESTAMP(3),
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorMilestone_vendorId_createdAt_idx" ON "public"."VendorMilestone"("vendorId", "createdAt");

ALTER TABLE "public"."VendorMilestone"
ADD CONSTRAINT "VendorMilestone_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."VendorInvoice" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "amountNgn" INTEGER NOT NULL,
  "note" TEXT,
  "status" "public"."VendorInvoiceStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorInvoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorInvoice_vendorId_createdAt_idx" ON "public"."VendorInvoice"("vendorId", "createdAt");

ALTER TABLE "public"."VendorInvoice"
ADD CONSTRAINT "VendorInvoice_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."FinanceEntry" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "vendorId" TEXT,
  "type" "public"."FinanceEntryType" NOT NULL,
  "status" "public"."FinanceStatus" NOT NULL DEFAULT 'LOGGED',
  "category" TEXT,
  "amountNgn" INTEGER NOT NULL,
  "description" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinanceEntry_eventId_createdAt_idx" ON "public"."FinanceEntry"("eventId", "createdAt");
CREATE INDEX "FinanceEntry_vendorId_idx" ON "public"."FinanceEntry"("vendorId");

ALTER TABLE "public"."FinanceEntry"
ADD CONSTRAINT "FinanceEntry_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."FinanceEntry"
ADD CONSTRAINT "FinanceEntry_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

