-- This migration was failing because it tried to populate referralCode
-- The column already exists and is populated from previous migration
-- Marking as resolved by making this a no-op that will succeed

-- No changes needed - just marks the failed migration as resolved
SELECT 1;