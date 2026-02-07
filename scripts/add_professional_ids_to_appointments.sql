-- Add new professional ID columns to appointments table
-- These separate concerns: calendar (who has it on agenda), charges (billing), and care (who attended - for commissions)

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS professional_id_calendario UUID REFERENCES professionals(id),
ADD COLUMN IF NOT EXISTS professional_id_cobro UUID REFERENCES professionals(id),
ADD COLUMN IF NOT EXISTS professional_id_atencion UUID REFERENCES professionals(id);

-- Migrate existing data: set all three fields to the current professional_id value
UPDATE appointments
SET 
  professional_id_calendario = CAST(professional_id AS UUID),
  professional_id_cobro = CAST(professional_id AS UUID),
  professional_id_atencion = CAST(professional_id AS UUID)
WHERE professional_id_calendario IS NULL;
