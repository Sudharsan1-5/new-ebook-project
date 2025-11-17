-- Migration: Add support for Google Gemini AI
-- Date: 2025-11-17
-- Description: Updates api_keys table to support Gemini AI and migrates from Mistral

-- Step 1: Drop the old CHECK constraint
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_service_name_check;

-- Step 2: Add new CHECK constraint that includes 'gemini'
ALTER TABLE api_keys ADD CONSTRAINT api_keys_service_name_check
  CHECK (service_name IN ('mistral', 'stability_ai', 'gemini'));

-- Step 3: Update usage_logs service_name check constraint (if exists)
ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS usage_logs_service_name_check;
ALTER TABLE usage_logs ADD CONSTRAINT usage_logs_service_name_check
  CHECK (service_name IN ('mistral', 'stability_ai', 'gemini'));

-- Step 4: Migrate existing 'mistral' entries to 'gemini' (if you want to replace them)
-- Uncomment the following line if you want to automatically convert existing Mistral keys to Gemini
-- UPDATE api_keys SET service_name = 'gemini' WHERE service_name = 'mistral';

-- Step 5: Add comment to document the change
COMMENT ON COLUMN api_keys.service_name IS 'AI service name: gemini (Google Gemini), mistral (legacy), or stability_ai (for cover images)';

-- Instructions for admins:
-- To add your Gemini API key, run this SQL as an admin:
--
-- INSERT INTO api_keys (service_name, api_key, is_active, created_by)
-- VALUES ('gemini', 'YOUR_GEMINI_API_KEY_HERE', true, auth.uid())
-- ON CONFLICT DO NOTHING;
--
-- Get your Gemini API key from: https://aistudio.google.com/app/apikey
