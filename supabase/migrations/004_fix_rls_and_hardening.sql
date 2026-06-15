-- 004_fix_rls_and_hardening.sql
-- Fixes critical bugs and hardens database

-- ============================================
-- 1. RLS POLICY FIXES (Critical bugs C1, C2)
-- ============================================

-- C1: Notifications had no INSERT policy — all notification creates were silently failing
CREATE POLICY "Authenticated users insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- C1b: Admins need to read/insert notifications for all users
CREATE POLICY "Admins manage all notifications" ON notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- C2: Bookings had no admin UPDATE policy — admin Approve/Deny/Complete buttons didn't work
CREATE POLICY "Admins update all bookings" ON bookings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Payments had no UPDATE/DELETE policy
CREATE POLICY "Booking participants update payments" ON payments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = payments.booking_id
    AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
  ));

-- ============================================
-- 2. MISSING INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_availability ON bookings(machinery_id, status, starting_date, ending_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_machinery_owner_status ON machinery(owner_id, status);

-- ============================================
-- 3. NOT NULL CONSTRAINTS
-- ============================================

UPDATE bookings SET payment_status = 'unpaid' WHERE payment_status IS NULL;
ALTER TABLE bookings ALTER COLUMN payment_status SET NOT NULL;

UPDATE notifications SET type = 'info' WHERE type IS NULL;
ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;

UPDATE payments SET payment_method = 'cash' WHERE payment_method IS NULL;
ALTER TABLE payments ALTER COLUMN payment_method SET NOT NULL;

ALTER TABLE lender_profiles ALTER COLUMN hectares SET NOT NULL;
ALTER TABLE lender_profiles ALTER COLUMN equipment_count SET NOT NULL;

-- ============================================
-- 4. SECURITY DEFINER hardening (search_path)
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SET search_path = 'public'
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'farmer'),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email)
  );
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'farmer') = 'lender' THEN
    INSERT INTO public.lender_profiles (id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_machinery_availability(p_machinery_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS BOOLEAN
SET search_path = 'public'
SECURITY DEFINER
AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE machinery_id = p_machinery_id
    AND status IN ('pending', 'approved', 'active')
    AND starting_date <= p_end_date
    AND ending_date >= p_start_date;
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
