-- Add retry fields for email notification delivery

ALTER TABLE "public"."Notification"
ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Notification_status_channel_nextAttemptAt_idx"
ON "public"."Notification"("status", "channel", "nextAttemptAt");

