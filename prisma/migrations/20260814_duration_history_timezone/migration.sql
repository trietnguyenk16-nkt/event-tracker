-- Event Tracker: duration, history, timezone and recurrence
ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  ADD COLUMN IF NOT EXISTS "duration_value" INTEGER,
  ADD COLUMN IF NOT EXISTS "duration_unit" TEXT,
  ADD COLUMN IF NOT EXISTS "source_event_id" TEXT,
  ADD COLUMN IF NOT EXISTS "recurrence_rule" TEXT,
  ADD COLUMN IF NOT EXISTS "recurrence_end" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "recurrence_count" INTEGER,
  ADD COLUMN IF NOT EXISTS "recurrence_index" INTEGER,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Event_idempotency_key_key" ON "Event"("idempotency_key");
CREATE INDEX IF NOT EXISTS "Event_source_event_id_idx" ON "Event"("source_event_id");
CREATE INDEX IF NOT EXISTS "Event_recurrence_rule_event_datetime_idx" ON "Event"("recurrence_rule", "event_datetime");
CREATE INDEX IF NOT EXISTS "Event_deleted_at_idx" ON "Event"("deleted_at");

DO $$ BEGIN
  ALTER TABLE "Event" ADD CONSTRAINT "Event_source_event_id_fkey"
    FOREIGN KEY ("source_event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "EventHistory" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "changes" JSONB,
  "actor" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventHistory_event_id_created_at_idx" ON "EventHistory"("event_id", "created_at");
DO $$ BEGIN
  ALTER TABLE "EventHistory" ADD CONSTRAINT "EventHistory_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
