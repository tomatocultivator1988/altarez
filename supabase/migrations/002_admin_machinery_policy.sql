-- Migration 002: Add missing admin RLS policies for machinery
CREATE POLICY "Admins read all machinery" ON machinery
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete all machinery" ON machinery
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
