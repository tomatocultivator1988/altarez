-- 011_fix_rls_subquery_ambiguity.sql
-- Fix: RLS WITH CHECK subqueries had "id = id" ambiguity causing
-- "more than one row returned by a subquery used as an expression"
-- Solution: Replace subquery-based checks with BEFORE UPDATE triggers
-- Triggers only fire for authenticated users (auth.uid() IS NOT NULL),
-- allowing service_role (admin client) to bypass.

-- ============================================
-- 1. Simplify profiles UPDATE policy (remove broken subqueries)
-- ============================================

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. Add trigger to prevent privilege escalation on profiles
-- ============================================

CREATE OR REPLACE FUNCTION check_profiles_update()
RETURNS TRIGGER
SET search_path = 'public'
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'Cannot change your own role';
    END IF;
    IF OLD.strikes IS DISTINCT FROM NEW.strikes OR OLD.is_banned IS DISTINCT FROM NEW.is_banned THEN
      RAISE EXCEPTION 'Cannot modify strikes or ban status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_profiles_update ON profiles;
CREATE TRIGGER trg_check_profiles_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_profiles_update();

-- ============================================
-- 3. Simplify bookings UPDATE policy (remove broken subqueries)
-- ============================================

DROP POLICY IF EXISTS "Involved users update bookings" ON bookings;
CREATE POLICY "Involved users update bookings" ON bookings
  FOR UPDATE USING (renter_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (renter_id = auth.uid() OR owner_id = auth.uid());

-- ============================================
-- 4. Add trigger to prevent booking tampering
-- ============================================

CREATE OR REPLACE FUNCTION check_bookings_update()
RETURNS TRIGGER
SET search_path = 'public'
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF OLD.renter_id IS DISTINCT FROM NEW.renter_id
       OR OLD.owner_id IS DISTINCT FROM NEW.owner_id
       OR OLD.machinery_id IS DISTINCT FROM NEW.machinery_id
       OR OLD.total_amount IS DISTINCT FROM NEW.total_amount
    THEN
      RAISE EXCEPTION 'Cannot modify renter, owner, machinery, or total amount';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_bookings_update ON bookings;
CREATE TRIGGER trg_check_bookings_update
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_bookings_update();
