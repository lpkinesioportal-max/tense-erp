-- Migration: Create tense_users table
-- Run this in Supabase SQL Editor

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

-- Enable Row Level Security
ALTER TABLE tense_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access
CREATE POLICY "Allow read access to users" ON tense_users
  FOR SELECT USING (true);

-- Policy: Allow full access for service role
CREATE POLICY "Allow full access for service role" ON tense_users
  FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON tense_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON tense_users(role);
CREATE INDEX IF NOT EXISTS idx_users_professional ON tense_users(professional_id);
CREATE INDEX IF NOT EXISTS idx_users_client ON tense_users(client_id);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON tense_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
