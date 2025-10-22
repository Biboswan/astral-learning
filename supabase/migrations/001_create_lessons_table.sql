-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  outline TEXT,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'generated', 'failed')),
  ts_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at);

-- Row Level Security disabled - allowing public access
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Public access policies (commented out for now)
-- CREATE POLICY "Allow public read access" ON lessons FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access" ON lessons FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update access" ON lessons FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete access" ON lessons FOR DELETE USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
