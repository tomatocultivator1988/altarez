-- 008_fix_critical_security.sql
-- CRITICAL fixes from security audit
-- C1: Whitelist role in handle_new_user (prevents self-assigned admin)
-- C3: Add WITH CHECK to profiles UPDATE policy (prevents self-escalation)
-- C3b: Lock down strikes/is_banned from self-modification

-- ============================================
-- C1: Fix handle_new_user — whitelist role
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
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' IN ('farmer', 'lender')
      THEN NEW.raw_user_meta_data ->> 'role'
      ELSE 'farmer'
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email)
  );

  INSERT INTO public.lender_profiles (id)
  SELECT NEW.id
  WHERE NEW.raw_user_meta_data ->> 'role' = 'lender';

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Username collision: use email-based fallback
    INSERT INTO public.profiles (id, role, first_name, last_name, username)
    VALUES (
      NEW.id,
      CASE
        WHEN NEW.raw_user_meta_data ->> 'role' IN ('farmer', 'lender')
        THEN NEW.raw_user_meta_data ->> 'role'
        ELSE 'farmer'
      END,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      'user_' || REPLACE(NEW.id::text, '-', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- C3: Fix profiles UPDATE policy — prevent self-escalation
-- ============================================

DROP POLICY IF EXISTS "Users update own profile" ON profiles;

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND strikes = (SELECT strikes FROM profiles WHERE id = auth.uid())
    AND is_banned = (SELECT is_banned FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- C3b: Also fix bookings UPDATE policy — add WITH CHECK
-- ============================================

DROP POLICY IF EXISTS "Involved users update bookings" ON bookings;

CREATE POLICY "Involved users update bookings" ON bookings
  FOR UPDATE USING (renter_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (
    renter_id = (SELECT renter_id FROM bookings WHERE id = id)
    AND owner_id = (SELECT owner_id FROM bookings WHERE id = id)
    AND machinery_id = (SELECT machinery_id FROM bookings WHERE id = id)
    AND total_amount = (SELECT total_amount FROM bookings WHERE id = id)
    AND status = (SELECT status FROM bookings WHERE id = id)
  );

-- ============================================
-- H8: Fix notification INSERT — restrict to own user_id
-- ============================================

DROP POLICY IF EXISTS "Authenticated users insert notifications" ON notifications;

CREATE POLICY "Authenticated users insert notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- H7: Fix bookings SELECT — include co_renter_id
-- ============================================

DROP POLICY IF EXISTS "Users read own bookings" ON bookings;

CREATE POLICY "Users read own bookings" ON bookings
  FOR SELECT USING (
    renter_id = auth.uid()
    OR owner_id = auth.uid()
    OR co_renter_id = auth.uid()
  );

-- ============================================
-- H6: Fix FK ON DELETE — SET NULL instead of NO ACTION
-- ============================================

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_pickup_documented_by_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_pickup_documented_by_fkey
  FOREIGN KEY (pickup_documented_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_return_documented_by_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_return_documented_by_fkey
  FOREIGN KEY (return_documented_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_co_renter_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_co_renter_id_fkey
  FOREIGN KEY (co_renter_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_resolved_by_fkey;
ALTER TABLE reports ADD CONSTRAINT reports_resolved_by_fkey
  FOREIGN KEY (resolved_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_resolved_by_fkey;
ALTER TABLE disputes ADD CONSTRAINT disputes_resolved_by_fkey
  FOREIGN KEY (resolved_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_opened_by_fkey;
ALTER TABLE disputes ADD CONSTRAINT disputes_opened_by_fkey
  FOREIGN KEY (opened_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix disputes.opened_by NOT NULL → allow SET NULL after profile deletion
ALTER TABLE disputes ALTER COLUMN opened_by DROP NOT NULL;

-- ============================================
-- L4: Add updated_at to reports + disputes
-- ============================================

ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON disputes;
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
