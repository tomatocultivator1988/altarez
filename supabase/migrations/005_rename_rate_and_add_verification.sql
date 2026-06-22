-- 005_rename_rate_and_add_verification.sql
-- Rename rate_per_hour → rate_per_hectare (pricing per hectare, not per hour)
-- Add actual_hectares and actual_hours for booking completion verification

ALTER TABLE machinery RENAME COLUMN rate_per_hour TO rate_per_hectare;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_hectares NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(10,2);
