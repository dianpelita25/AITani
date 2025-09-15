-- Add photo_url columns to store public URL of uploaded images
-- Note: D1/SQLite migrations don't support IF NOT EXISTS on ADD COLUMN
-- These migrations are applied once, so plain ADD COLUMN is fine.

ALTER TABLE alerts ADD COLUMN photo_url TEXT;
ALTER TABLE diagnosis ADD COLUMN photo_url TEXT;

-- No index needed; accessed as part of row fetch
