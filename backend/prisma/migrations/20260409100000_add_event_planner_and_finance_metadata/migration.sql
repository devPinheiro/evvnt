-- Module 09: Event Planner persisted state + finance metadata for planner budget push
CREATE TABLE "EventPlannerSettings" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "hallState" JSONB NOT NULL DEFAULT '{}',
    "costState" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPlannerSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventPlannerSettings_eventId_key" ON "EventPlannerSettings"("eventId");

ALTER TABLE "EventPlannerSettings" ADD CONSTRAINT "EventPlannerSettings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinanceEntry" ADD COLUMN "metadata" JSONB;
