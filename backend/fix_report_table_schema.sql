-- Fix Report Table Schema
-- Change inspection_id from NOT NULL to NULL to match backend schema
-- This allows reports to be generated without an inspection context

ALTER TABLE public."Report" 
ALTER COLUMN inspection_id DROP NOT NULL;

-- Verify the change
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'Report' AND column_name = 'inspection_id';


