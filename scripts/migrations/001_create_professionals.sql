-- Migration: Create tense_professionals table
-- Run this in Supabase SQL Editor

-- Create the table
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

-- Enable Row Level Security
ALTER TABLE tense_professionals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users
CREATE POLICY "Allow read access to professionals" ON tense_professionals
  FOR SELECT USING (true);

-- Policy: Allow insert/update/delete for service role
CREATE POLICY "Allow full access for service role" ON tense_professionals
  FOR ALL USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_professionals_email ON tense_professionals(email);
CREATE INDEX IF NOT EXISTS idx_professionals_active ON tense_professionals(is_active);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON tense_professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
