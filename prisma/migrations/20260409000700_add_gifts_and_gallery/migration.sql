-- Gifts + Gallery skeleton tables (MVP)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GiftStatus') THEN
    CREATE TYPE "public"."GiftStatus" AS ENUM ('INITIATED', 'SUCCEEDED', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GiftPayoutStatus') THEN
    CREATE TYPE "public"."GiftPayoutStatus" AS ENUM ('REQUESTED', 'PAID', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GalleryVisibility') THEN
    CREATE TYPE "public"."GalleryVisibility" AS ENUM ('PUBLIC', 'GUEST_ONLY', 'PASSWORD');
  END IF;
END$$;

CREATE TABLE "public"."GiftSettings" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "hostDisplayName" TEXT,
  "hostPhotoUrl" TEXT,
  "pageMessage" TEXT,
  "suggestedAmounts" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GiftSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GiftSettings_eventId_key" ON "public"."GiftSettings"("eventId");

ALTER TABLE "public"."GiftSettings"
ADD CONSTRAINT "GiftSettings_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."Gift" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "amountNgn" INTEGER NOT NULL,
  "senderName" TEXT,
  "senderEmail" TEXT,
  "senderPhone" TEXT,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "message" TEXT,
  "status" "public"."GiftStatus" NOT NULL DEFAULT 'INITIATED',
  "paystackRef" TEXT,
  "providerEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Gift_paystackRef_key" ON "public"."Gift"("paystackRef");
CREATE INDEX "Gift_eventId_createdAt_idx" ON "public"."Gift"("eventId", "createdAt");

ALTER TABLE "public"."Gift"
ADD CONSTRAINT "Gift_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."GiftPayout" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "amountNgn" INTEGER NOT NULL,
  "status" "public"."GiftPayoutStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "GiftPayout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GiftPayout_eventId_requestedAt_idx" ON "public"."GiftPayout"("eventId", "requestedAt");

ALTER TABLE "public"."GiftPayout"
ADD CONSTRAINT "GiftPayout_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."GallerySettings" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "guestUploadEnabled" BOOLEAN NOT NULL DEFAULT false,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
  "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
  "visibility" "public"."GalleryVisibility" NOT NULL DEFAULT 'GUEST_ONLY',
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GallerySettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GallerySettings_eventId_key" ON "public"."GallerySettings"("eventId");

ALTER TABLE "public"."GallerySettings"
ADD CONSTRAINT "GallerySettings_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."GalleryAsset" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "uploadedBy" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "approvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GalleryAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GalleryAsset_eventId_createdAt_idx" ON "public"."GalleryAsset"("eventId", "createdAt");
CREATE INDEX "GalleryAsset_eventId_isApproved_idx" ON "public"."GalleryAsset"("eventId", "isApproved");

ALTER TABLE "public"."GalleryAsset"
ADD CONSTRAINT "GalleryAsset_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."GalleryAsset"
ADD CONSTRAINT "GalleryAsset_uploadedBy_fkey"
FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

