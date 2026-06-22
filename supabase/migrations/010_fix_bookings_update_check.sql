-- 010_fix_bookings_update_check.sql
-- Fix: Migration 008's WITH CHECK on bookings UPDATE incorrectly blocked ALL status changes
-- The "status = (SELECT status...)" clause prevents any status transition.
-- This fix keeps renter_id/owner_id/machinery_id/total_amount immutable,
-- but allows status to change (which is the whole point of the booking state machine).

DROP POLICY IF EXISTS "Involved users update bookings" ON bookings;

CREATE POLICY "Involved users update bookings" ON bookings
  FOR UPDATE USING (renter_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (
    renter_id = (SELECT renter_id FROM bookings WHERE id = id)
    AND owner_id = (SELECT owner_id FROM bookings WHERE id = id)
    AND machinery_id = (SELECT machinery_id FROM bookings WHERE id = id)
    AND total_amount = (SELECT total_amount FROM bookings WHERE id = id)
  );
