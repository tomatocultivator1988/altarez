-- 009_fix_nullability_and_types.sql
-- M9: Fix type vs DB nullability mismatches
-- 1. Set remaining nullable columns to NOT NULL with defaults
-- 2. No backfill needed — all existing rows have values via defaults

-- payments: payment_method should be NOT NULL (already enforced by 004, ensure constraint)
-- bookings: payment_status should be NOT NULL (already enforced by 004, ensure constraint)
-- profiles: is_fca_member should be NOT NULL with default

ALTER TABLE profiles ALTER COLUMN is_fca_member SET DEFAULT false;

UPDATE profiles SET is_fca_member = false WHERE is_fca_member IS NULL;

ALTER TABLE profiles ALTER COLUMN is_fca_member SET NOT NULL;
