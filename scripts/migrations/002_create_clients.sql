-- Migration: Create tense_clients table
-- Run this in Supabase SQL Editor

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

-- Enable Row Level Security
ALTER TABLE tense_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access
CREATE POLICY "Allow read access to clients" ON tense_clients
  FOR SELECT USING (true);

-- Policy: Allow full access for service role
CREATE POLICY "Allow full access for service role" ON tense_clients
  FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON tense_clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_dni ON tense_clients(dni);
CREATE INDEX IF NOT EXISTS idx_clients_name ON tense_clients(name);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON tense_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
