-- Minimal Database Migration: Single Category to Multi-Tag System
-- Execute this SQL in your Supabase SQL editor

-- ============================================================================
-- STEP 1: Create new tables for tag system
-- ============================================================================

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create junction table for many-to-many relationship between bookmarks and tags
CREATE TABLE IF NOT EXISTS bookmark_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bookmark_id, tag_id)
);

-- ============================================================================
-- STEP 2: Copy data from categories to tags table
-- ============================================================================

-- Migrate all existing categories to tags table
INSERT INTO tags (id, user_id, name, created_at)
SELECT id, user_id, name, created_at 
FROM categories
ON CONFLICT (user_id, name) DO NOTHING;

-- ============================================================================
-- STEP 3: Migrate existing bookmark-category relationships
-- ============================================================================

-- Create bookmark-tag relationships for all existing bookmarks with categories
INSERT INTO bookmark_tags (bookmark_id, tag_id)
SELECT b.id as bookmark_id, t.id as tag_id
FROM bookmarks b
JOIN tags t ON (b.category = t.name AND b.user_id = t.user_id)
WHERE b.category IS NOT NULL;

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

-- Indexes for bookmark_tags junction table
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_bookmark_id ON bookmark_tags(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON bookmark_tags(tag_id);

-- Indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ============================================================================
-- STEP 5: Enable Row Level Security for new tables
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags table (MVP - allow all for simplicity)
CREATE POLICY "Users can manage tags" ON tags FOR ALL USING (true);
CREATE POLICY "Users can manage bookmark tags" ON bookmark_tags FOR ALL USING (true);

-- ============================================================================
-- STEP 6: Create view for easier querying (OPTIONAL but recommended)
-- ============================================================================

-- View that returns bookmarks with their tags as arrays
CREATE OR REPLACE VIEW bookmarks_with_tags AS
SELECT 
  b.*,
  COALESCE(
    array_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
    '{}'::text[]
  ) as tags
FROM bookmarks b
LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
LEFT JOIN tags t ON bt.tag_id = t.id
GROUP BY b.id, b.user_id, b.url, b.title, b.summary, b.category, b.created_at;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to check migration success)
-- ============================================================================

-- Check 1: Count of categories vs tags should match
-- SELECT 
--   (SELECT COUNT(*) FROM categories) as category_count,
--   (SELECT COUNT(*) FROM tags) as tag_count;

-- Check 2: Count of bookmarks with categories vs bookmark_tags relationships
-- SELECT 
--   (SELECT COUNT(*) FROM bookmarks WHERE category IS NOT NULL) as bookmarks_with_category,
--   (SELECT COUNT(DISTINCT bookmark_id) FROM bookmark_tags) as bookmarks_with_tags;

-- Check 3: Test the view with sample data
-- SELECT * FROM bookmarks_with_tags LIMIT 5;