-- Master migration script: Run all migrations in order
-- Run this in Supabase SQL Editor to set up all tables at once

-- ============================================
-- STEP 0: Create helper function for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- STEP 1: Create tense_professionals table
-- ============================================
CREATE TABLE IF NOT EXISTS tense_professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  specialty TEXT,
  color TEXT,
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
  standard_duration INTEGER DEFAULT 60,
  non_working_days INTEGER[] DEFAULT ARRAY[0, 6],
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  commission_rate NUMERIC(5,2) DEFAULT 35,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  availability JSONB,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tense_professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to professionals" ON tense_professionals;
CREATE POLICY "Allow read access to professionals" ON tense_professionals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow full access for service role professionals" ON tense_professionals;
CREATE POLICY "Allow full access for service role professionals" ON tense_professionals FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_professionals_email ON tense_professionals(email);
CREATE INDEX IF NOT EXISTS idx_professionals_active ON tense_professionals(is_active);

DROP TRIGGER IF EXISTS update_professionals_updated_at ON tense_professionals;
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON tense_professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 2: Create tense_clients table
-- ============================================
CREATE TABLE IF NOT EXISTS tense_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dni TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  special_discount NUMERIC(5,2) DEFAULT 0,
  profile_image TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tense_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to clients" ON tense_clients;
CREATE POLICY "Allow read access to clients" ON tense_clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow full access for service role clients" ON tense_clients;
CREATE POLICY "Allow full access for service role clients" ON tense_clients FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_clients_email ON tense_clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_dni ON tense_clients(dni);
CREATE INDEX IF NOT EXISTS idx_clients_name ON tense_clients(name);

DROP TRIGGER IF EXISTS update_clients_updated_at ON tense_clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON tense_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 3: Create tense_users table
-- ============================================
CREATE TABLE IF NOT EXISTS tense_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'profesional', 'cliente')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_active BOOLEAN DEFAULT true,
  professional_id TEXT REFERENCES tense_professionals(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES tense_clients(id) ON DELETE SET NULL,
  phone TEXT,
  dni TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tense_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to users" ON tense_users;
CREATE POLICY "Allow read access to users" ON tense_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow full access for service role users" ON tense_users;
CREATE POLICY "Allow full access for service role users" ON tense_users FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_users_email ON tense_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON tense_users(role);
CREATE INDEX IF NOT EXISTS idx_users_professional ON tense_users(professional_id);
CREATE INDEX IF NOT EXISTS idx_users_client ON tense_users(client_id);

DROP TRIGGER IF EXISTS update_users_updated_at ON tense_users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON tense_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Create tense_appointments table
-- ============================================
CREATE TABLE IF NOT EXISTS tense_appointments (
  id TEXT PRIMARY KEY,
  professional_id TEXT REFERENCES tense_professionals(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES tense_clients(id) ON DELETE SET NULL,
  service_id TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  base_price NUMERIC(12,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  final_price NUMERIC(12,2),
  professional_percentage NUMERIC(5,2),
  professional_earnings NUMERIC(12,2),
  recommended_deposit NUMERIC(12,2),
  deposit_amount NUMERIC(12,2) DEFAULT 0,
  is_deposit_complete BOOLEAN DEFAULT false,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  payments JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending_deposit',
  is_paid BOOLEAN DEFAULT false,
  cash_collected NUMERIC(12,2) DEFAULT 0,
  transfer_collected NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  comments JSONB DEFAULT '[]',
  is_overtime_mode BOOLEAN DEFAULT false,
  cancel_reason TEXT,
  cash_in_tense NUMERIC(12,2),
  transfers_to_professional NUMERIC(12,2),
  payment_resolution_status TEXT CHECK (payment_resolution_status IN ('ok', 'pending_resolution')),
  payment_resolution_mode TEXT CHECK (payment_resolution_mode IN ('neteo_liquidacion', 'transferencia')),
  adjustment_id TEXT,
  professional_id_calendario TEXT,
  professional_id_cobro TEXT,
  professional_id_atencion TEXT,
  professional_previous_id TEXT,
  professional_new_id TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tense_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to appointments" ON tense_appointments;
CREATE POLICY "Allow read access to appointments" ON tense_appointments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow full access for service role appointments" ON tense_appointments;
CREATE POLICY "Allow full access for service role appointments" ON tense_appointments FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON tense_appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON tense_appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON tense_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON tense_appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_professional ON tense_appointments(date, professional_id);

DROP TRIGGER IF EXISTS update_appointments_updated_at ON tense_appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON tense_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! All 4 main tables created successfully
-- ============================================
SELECT 'Migration complete! Created tables: tense_professionals, tense_clients, tense_users, tense_appointments' as result;
