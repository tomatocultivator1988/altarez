-- Drop ALL admin RLS policies that query profiles with subquery
-- These cause infinite recursion because profiles RLS policies also query profiles.
-- Admin operations use createAdminClient() (service_role) which bypasses RLS entirely.

-- Profiles (self-referencing -> always recursive)
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON profiles;

-- Lender profiles (profiles subquery -> recursion)
DROP POLICY IF EXISTS "Admins read all lender profiles" ON lender_profiles;

-- Machinery (profiles subquery -> recursion)
DROP POLICY IF EXISTS "Admins read all machinery" ON machinery;
DROP POLICY IF EXISTS "Admins update all machinery" ON machinery;
DROP POLICY IF EXISTS "Admins delete all machinery" ON machinery;

-- Bookings (profiles subquery -> recursion)
DROP POLICY IF EXISTS "Admins read all bookings" ON bookings;

-- Payments (profiles subquery -> recursion)
DROP POLICY IF EXISTS "Admins read all payments" ON payments;

-- Uploads (profiles subquery -> recursion)
DROP POLICY IF EXISTS "Admins read all uploads" ON uploads;
