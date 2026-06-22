-- 007_photo_rls.sql
-- RLS policies for reports and disputes tables

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users read own reports" ON reports
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reports.booking_id
        AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
    )
  );

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners create disputes" ON disputes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = disputes.booking_id
        AND bookings.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users read own disputes" ON disputes
  FOR SELECT USING (
    opened_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = disputes.booking_id
        AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())
    )
  );
