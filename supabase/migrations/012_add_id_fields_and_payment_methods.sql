-- 012_add_id_fields_and_payment_methods.sql
-- 1. Add id_type and id_number columns to profiles
-- 2. Expand payment_method CHECK to include digital options

-- ============================================
-- 1. Add ID verification fields to profiles
-- ============================================
ALTER TABLE profiles
  ADD COLUMN id_type TEXT,
  ADD COLUMN id_number TEXT;

-- ============================================
-- 2. Expand payment_method CHECK constraint
-- ============================================
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('cash', 'bank_transfer', 'gcash', 'maya'));
