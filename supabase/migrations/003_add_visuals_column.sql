-- Add visuals column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS visuals JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN lessons.visuals IS 'Array of visual image objects with block_id and imageData and imageType';

-- Create an index on the visuals column for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_visuals ON lessons USING gin (visuals);

