-- Add js_code column to lessons table
ALTER TABLE lessons ADD COLUMN js_code TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN lessons.js_code IS 'JavaScript code for the lesson';
