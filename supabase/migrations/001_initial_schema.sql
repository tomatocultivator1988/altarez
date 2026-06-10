-- ============================================
-- Agrimalachina: Initial Schema Migration
-- Supabase / PostgreSQL
-- ============================================

-- ========== PROFILES ==========
-- Linked to auth.users; stores role + personal info
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('farmer', 'lender', 'admin')),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  phone_number  TEXT,
  is_fca_member BOOLEAN DEFAULT false,
  barangay      TEXT,
  address       TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ========== LENDER PROFILES ==========
CREATE TABLE lender_profiles (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  hectares        NUMERIC(10,2) DEFAULT 0,
  farm_location   TEXT,
  equipment_count INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========== MACHINERY ==========
CREATE TABLE machinery (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  machine_name    TEXT NOT NULL,
  description     TEXT,
  machine_type    TEXT NOT NULL CHECK (machine_type IN ('4wd_tractor','hand_tractor','floating_tiller','harvester','hauling','dryer','miller','craft_establishment')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_use', 'maintenance', 'inactive')),
  serial_number   TEXT,
  image_url       TEXT,
  hectares_capacity NUMERIC(10,2),
  rate_per_hour   NUMERIC(10,2),
  barangay        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========== BOOKINGS / RENTALS ==========
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machinery_id      UUID NOT NULL REFERENCES machinery(id) ON DELETE CASCADE,
  renter_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'denied', 'cancelled')),
  requested_hectares NUMERIC(10,2),
  starting_date     DATE NOT NULL,
  ending_date       DATE NOT NULL,
  estimated_hours   NUMERIC(10,2),
  total_amount      NUMERIC(10,2),
  payment_status    TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PAYMENTS ==========
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  payment_method  TEXT DEFAULT 'cash',
  payment_date    TIMESTAMPTZ DEFAULT NOW(),
  receipt_url     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========== NOTIFICATIONS ==========
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  type          TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read       BOOLEAN DEFAULT false,
  link          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ========== UPLOADS ==========
CREATE TABLE uploads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
  machinery_id    UUID REFERENCES machinery(id) ON DELETE SET NULL,
  file_name       TEXT NOT NULL,
  blob_url        TEXT NOT NULL,
  content_type    TEXT,
  file_size       INTEGER,
  upload_type     TEXT CHECK (upload_type IN ('receipt', 'machinery_image', 'document', 'other')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_machinery_owner ON machinery(owner_id);
CREATE INDEX idx_machinery_status ON machinery(status);
CREATE INDEX idx_machinery_type ON machinery(machine_type);
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);
CREATE INDEX idx_bookings_machinery ON bookings(machinery_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(starting_date, ending_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_uploads_user ON uploads(user_id);

-- ========== UPDATED_AT TRIGGERS ==========
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lender_profiles_updated_at BEFORE UPDATE ON lender_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_machinery_updated_at BEFORE UPDATE ON machinery FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========== PROFILE AUTO-CREATE TRIGGER ==========
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)
  );

  IF NEW.raw_user_meta_data->>'role' = 'lender' THEN
    INSERT INTO public.lender_profiles (id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========== BOOKING CONFLICT CHECK FUNCTION ==========
CREATE OR REPLACE FUNCTION check_machinery_availability(
  p_machinery_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE machinery_id = p_machinery_id
    AND status IN ('pending', 'approved', 'active')
    AND starting_date <= p_end_date
    AND ending_date >= p_start_date;

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete profiles" ON profiles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Lender profiles
CREATE POLICY "Lenders read own" ON lender_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Lenders update own" ON lender_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all lender profiles" ON lender_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Machinery
CREATE POLICY "Anyone read active machinery" ON machinery FOR SELECT USING (status = 'active' OR owner_id = auth.uid());
CREATE POLICY "Lenders and admins create machinery" ON machinery FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lender', 'admin')));
CREATE POLICY "Owners update own machinery" ON machinery FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Admins update all machinery" ON machinery FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Owners delete own machinery" ON machinery FOR DELETE USING (owner_id = auth.uid());

-- Bookings
CREATE POLICY "Users read own bookings" ON bookings FOR SELECT USING (renter_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Admins read all bookings" ON bookings FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Renters create bookings" ON bookings FOR INSERT WITH CHECK (renter_id = auth.uid());
CREATE POLICY "Involved users update bookings" ON bookings FOR UPDATE USING (renter_id = auth.uid() OR owner_id = auth.uid());

-- Payments
CREATE POLICY "Users read own payments" ON payments FOR SELECT USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = payments.booking_id AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())));
CREATE POLICY "Admins read all payments" ON payments FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Create payment for own booking" ON payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = payments.booking_id AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid())));

-- Notifications
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Uploads
CREATE POLICY "Users read own uploads" ON uploads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins read all uploads" ON uploads FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users create uploads" ON uploads FOR INSERT WITH CHECK (user_id = auth.uid());
