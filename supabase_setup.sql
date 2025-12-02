-- Create the profile_series table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS profile_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_meter NUMERIC(10, 2) NOT NULL,
  color_category TEXT NOT NULL,
  chambers INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profile_series ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- Adjust this policy based on your authentication requirements
CREATE POLICY "Allow all operations for authenticated users" ON profile_series
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Or if you want to allow public access (for development only):
-- CREATE POLICY "Allow public access" ON profile_series
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- Create an index on name for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_series_name ON profile_series(name);

-- Insert some initial data (optional)
INSERT INTO profile_series (name, price_per_meter, color_category, chambers) VALUES
  ('Rehau 70mm', 45.00, 'White', 5),
  ('Salamander Bluevolution', 52.00, 'White', 7)
ON CONFLICT DO NOTHING;

