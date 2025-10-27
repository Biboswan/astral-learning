-- Add 'generated_content' status to the status check constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;

-- Recreate the constraint with the new status value
ALTER TABLE lessons ADD CONSTRAINT lessons_status_check 
  CHECK (status IN ('generating', 'generated_content', 'generated', 'failed'));

