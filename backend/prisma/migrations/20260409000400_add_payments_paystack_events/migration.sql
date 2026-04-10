-- Add Paystack payments event log for webhook idempotency

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentProvider') THEN
    CREATE TYPE "public"."PaymentProvider" AS ENUM ('PAYSTACK');
  END IF;
END$$;

CREATE TABLE "public"."PaymentEvent" (
  "id" TEXT NOT NULL,
  "provider" "public"."PaymentProvider" NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentEvent_provider_providerEventId_key"
ON "public"."PaymentEvent"("provider", "providerEventId");

CREATE INDEX "PaymentEvent_provider_receivedAt_idx"
ON "public"."PaymentEvent"("provider", "receivedAt");

