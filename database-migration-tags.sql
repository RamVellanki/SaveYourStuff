-- Database Migration: Single Category to Multi-Tag System
-- Execute this SQL in your Supabase SQL editor AFTER backing up your data

-- ============================================================================
-- STEP 1: Create new tables for tag system
-- ============================================================================

-- Rename categories table to tags for better clarity
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
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_created_at ON bookmark_tags(created_at DESC);

-- Indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Update existing bookmark indexes (remove category index since we'll phase it out)
-- Note: We'll keep the category column temporarily for backward compatibility

-- ============================================================================
-- STEP 5: Enable Row Level Security for new tables
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags table
CREATE POLICY "Users can view their own tags" ON tags
  FOR SELECT USING (true); -- For MVP, allow all reads

CREATE POLICY "Users can insert their own tags" ON tags
  FOR INSERT WITH CHECK (true); -- For MVP, allow all inserts

CREATE POLICY "Users can update their own tags" ON tags
  FOR UPDATE USING (true); -- For MVP, allow all updates

CREATE POLICY "Users can delete their own tags" ON tags
  FOR DELETE USING (true); -- For MVP, allow all deletes

-- Create RLS policies for bookmark_tags junction table
CREATE POLICY "Users can view bookmark tags" ON bookmark_tags
  FOR SELECT USING (true); -- For MVP, allow all reads

CREATE POLICY "Users can insert bookmark tags" ON bookmark_tags
  FOR INSERT WITH CHECK (true); -- For MVP, allow all inserts

CREATE POLICY "Users can delete bookmark tags" ON bookmark_tags
  FOR DELETE USING (true); -- For MVP, allow all deletes

-- ============================================================================
-- STEP 6: Create helpful functions for tag operations
-- ============================================================================

-- Function to get all tags for a specific bookmark
CREATE OR REPLACE FUNCTION get_bookmark_tags(bookmark_uuid UUID)
RETURNS TABLE(tag_id UUID, tag_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name
  FROM tags t
  JOIN bookmark_tags bt ON t.id = bt.tag_id
  WHERE bt.bookmark_id = bookmark_uuid
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;

-- Function to add a tag to a bookmark (creates tag if it doesn't exist)
CREATE OR REPLACE FUNCTION add_tag_to_bookmark(
  bookmark_uuid UUID,
  tag_name TEXT,
  user_uuid TEXT
)
RETURNS UUID AS $$
DECLARE
  tag_uuid UUID;
BEGIN
  -- Get or create the tag
  INSERT INTO tags (user_id, name)
  VALUES (user_uuid, tag_name)
  ON CONFLICT (user_id, name) DO NOTHING;
  
  SELECT id INTO tag_uuid FROM tags WHERE user_id = user_uuid AND name = tag_name;
  
  -- Link bookmark to tag
  INSERT INTO bookmark_tags (bookmark_id, tag_id)
  VALUES (bookmark_uuid, tag_uuid)
  ON CONFLICT (bookmark_id, tag_id) DO NOTHING;
  
  RETURN tag_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a tag from a bookmark
CREATE OR REPLACE FUNCTION remove_tag_from_bookmark(
  bookmark_uuid UUID,
  tag_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM bookmark_tags 
  WHERE bookmark_id = bookmark_uuid AND tag_id = tag_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Create views for easier querying
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
-- STEP 8: Data validation queries
-- ============================================================================

-- Query to verify migration was successful
-- Run these after migration to ensure data integrity

-- Check 1: Count of categories vs tags should match
-- SELECT 
--   (SELECT COUNT(*) FROM categories) as category_count,
--   (SELECT COUNT(*) FROM tags) as tag_count;

-- Check 2: Count of bookmarks with categories vs bookmark_tags relationships
-- SELECT 
--   (SELECT COUNT(*) FROM bookmarks WHERE category IS NOT NULL) as bookmarks_with_category,
--   (SELECT COUNT(DISTINCT bookmark_id) FROM bookmark_tags) as bookmarks_with_tags;

-- Check 3: Verify all categories were migrated to tags
-- SELECT c.name 
-- FROM categories c 
-- LEFT JOIN tags t ON (c.name = t.name AND c.user_id = t.user_id)
-- WHERE t.id IS NULL;

-- Check 4: Test the view with sample data
-- SELECT * FROM bookmarks_with_tags LIMIT 5;

-- ============================================================================
-- FUTURE CLEANUP (run after confirming everything works)
-- ============================================================================

-- After confirming the migration is successful and the application is working:
-- 1. Drop the category column from bookmarks table:
--    ALTER TABLE bookmarks DROP COLUMN category;
-- 
-- 2. Drop the old categories table:
--    DROP TABLE categories CASCADE;
--
-- 3. Remove the old category index:
--    DROP INDEX IF EXISTS idx_bookmarks_category;

-- ============================================================================
-- ROLLBACK PLAN (if needed)
-- ============================================================================

-- If you need to rollback this migration:
-- 1. Drop the new tables: DROP TABLE bookmark_tags, tags CASCADE;
-- 2. Restore from backup
-- 3. The category column in bookmarks table will still be intact

-- For now, we'll keep both systems in parallel for safety