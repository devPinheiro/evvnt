-- Add Guests, Invites, and RSVP tables for Guest Management + E-Invite/RSVP modules

-- Enum for RSVP and attendance lifecycle
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RsvpStatus') THEN
    CREATE TYPE "public"."RsvpStatus" AS ENUM (
      'NOT_SENT',
      'INVITED',
      'RSVP_YES',
      'RSVP_NO',
      'RSVP_MAYBE',
      'ARRIVED',
      'NO_SHOW'
    );
  END IF;
END$$;

CREATE TABLE "public"."Guest" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "groups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "public"."RsvpStatus" NOT NULL DEFAULT 'NOT_SENT',
  "plusOnes" INTEGER NOT NULL DEFAULT 0,
  "tableNo" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Guest_eventId_createdAt_idx" ON "public"."Guest"("eventId", "createdAt");
CREATE INDEX "Guest_eventId_email_idx" ON "public"."Guest"("eventId", "email");
CREATE INDEX "Guest_eventId_phone_idx" ON "public"."Guest"("eventId", "phone");

ALTER TABLE "public"."Guest"
ADD CONSTRAINT "Guest_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."Invite" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "guestId" TEXT,
  "token" TEXT NOT NULL,
  "channel" TEXT,
  "sentAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invite_token_key" ON "public"."Invite"("token");
CREATE INDEX "Invite_eventId_createdAt_idx" ON "public"."Invite"("eventId", "createdAt");
CREATE INDEX "Invite_guestId_idx" ON "public"."Invite"("guestId");

ALTER TABLE "public"."Invite"
ADD CONSTRAINT "Invite_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Invite"
ADD CONSTRAINT "Invite_guestId_fkey"
FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "public"."RSVP" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "inviteId" TEXT NOT NULL,
  "guestId" TEXT,
  "status" "public"."RsvpStatus" NOT NULL,
  "guestName" TEXT,
  "guestEmail" TEXT,
  "guestPhone" TEXT,
  "message" TEXT,
  "plusOnes" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RSVP_eventId_createdAt_idx" ON "public"."RSVP"("eventId", "createdAt");
CREATE INDEX "RSVP_inviteId_idx" ON "public"."RSVP"("inviteId");

ALTER TABLE "public"."RSVP"
ADD CONSTRAINT "RSVP_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."RSVP"
ADD CONSTRAINT "RSVP_inviteId_fkey"
FOREIGN KEY ("inviteId") REFERENCES "public"."Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."RSVP"
ADD CONSTRAINT "RSVP_guestId_fkey"
FOREIGN KEY ("guestId") REFERENCES "public"."Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

