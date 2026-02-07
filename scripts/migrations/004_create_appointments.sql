-- Migration: Create tense_appointments table
-- Run this in Supabase SQL Editor

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

-- Enable Row Level Security
ALTER TABLE tense_appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access
CREATE POLICY "Allow read access to appointments" ON tense_appointments
  FOR SELECT USING (true);

-- Policy: Allow full access for service role
CREATE POLICY "Allow full access for service role" ON tense_appointments
  FOR ALL USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON tense_appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON tense_appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON tense_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON tense_appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_professional ON tense_appointments(date, professional_id);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON tense_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
