-- Password Reset SQL for user 'asillah'
-- Run this in Supabase SQL Editor
-- 
-- NOTE: You need to generate the bcrypt hash first by running:
-- python generate_hash.py
-- Then copy the hash from the output and paste it below

-- First, let's see what the current hash looks like:
SELECT username, LEFT(hashed_password, 30) as hash_preview, "Account_status"
FROM "User" 
WHERE username = 'asillah';

-- To reset the password, you need to:
-- 1. Run: python generate_hash.py (in your terminal)
-- 2. Copy the generated hash
-- 3. Run the UPDATE statement below with the new hash

-- UPDATE "User"
-- SET hashed_password = 'PASTE_GENERATED_HASH_HERE',
--     temp_password = false
-- WHERE username = 'asillah';


