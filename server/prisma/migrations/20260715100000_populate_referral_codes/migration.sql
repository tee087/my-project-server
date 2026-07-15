-- Populate referral codes for existing users
-- This generates a 12-char hex code for each user missing one
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
BEGIN
  FOR user_record IN SELECT id FROM "users" WHERE "referralCode" IS NULL OR "referralCode" = '' LOOP
    -- Generate a random 12-char hex code
    SELECT replace(uuid_generate_v4()::text, '-', '')[1:12] INTO new_code;
    
    -- Update user with new referral code (uppercase)
    UPDATE "users" SET "referralCode" = UPPER(new_code) WHERE id = user_record.id;
  END LOOP;
END $$;