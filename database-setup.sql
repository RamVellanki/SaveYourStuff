-- Contextual Bookmarking System - Database Setup
-- Execute this SQL in your Supabase SQL editor

-- Create users table (if not using Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Create full-text search index for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_search ON bookmarks
USING GIN (to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || url));

-- Enable Row Level Security (RLS)
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Note: Adjust these based on your auth setup)
-- For development, you might want to disable RLS or create permissive policies

-- Policy for bookmarks: users can only access their own bookmarks
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
  FOR SELECT USING (true); -- For MVP, allow all reads

CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (true); -- For MVP, allow all inserts

-- Policy for categories: users can only access their own categories
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (true); -- For MVP, allow all reads

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (true); -- For MVP, allow all inserts

-- Insert some sample categories for testing
INSERT INTO categories (user_id, name) VALUES
  ('test-user-123', 'Development'),
  ('test-user-123', 'Design'),
  ('test-user-123', 'Reading'),
  ('test-user-123', 'Research')
ON CONFLICT (user_id, name) DO NOTHING;
