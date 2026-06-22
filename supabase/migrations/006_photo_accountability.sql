-- 006_photo_accountability.sql
-- Photo-gated booking documentation system
-- Hour meter tracking, deposits, strikes, reports, disputes

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hour_meter_start       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS hour_meter_end         NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS security_deposit       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pickup_documented_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_documented_by   UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS return_documented_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_documented_by   UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS co_renter_id           UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS anomaly_flagged        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS anomaly_note           TEXT,
  ADD COLUMN IF NOT EXISTS admin_override         BOOLEAN DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS strikes      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_banned    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

ALTER TABLE uploads DROP CONSTRAINT IF EXISTS uploads_upload_type_check;
ALTER TABLE uploads ADD CONSTRAINT uploads_upload_type_check CHECK (
  upload_type IN (
    'receipt', 'machinery_image', 'document', 'other',
    'pickup_equipment', 'pickup_selfie', 'pickup_hour_meter',
    'return_equipment', 'return_hour_meter', 'return_damage'
  )
);

CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  report_type     TEXT NOT NULL CHECK (report_type IN ('suspicious_activity', 'damage', 'subletting', 'other')),
  description     TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  resolved_by     UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  opened_by        UUID NOT NULL REFERENCES profiles(id),
  reason           TEXT NOT NULL,
  status           TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved_lender', 'resolved_renter', 'admin_resolved')),
  resolution_notes TEXT,
  resolved_by      UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_uploads_booking_type ON uploads(booking_id, upload_type);
CREATE INDEX IF NOT EXISTS idx_reports_booking ON reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
