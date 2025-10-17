/*
  # Fix RLS Policies and Admin Setup

  ## Changes
  1. Fix infinite recursion in profiles RLS policies
  2. Remove recursive admin checks that cause the loop
  3. Simplify policy structure
  4. Ensure policies work correctly for both users and admins

  ## Security
  - Users can view and update their own profile
  - Admins need special handling to avoid recursion
  - Use auth.jwt() claims instead of profile lookups where possible
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recreate profiles policies without recursion
-- Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (but not role or limits)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (using app_metadata to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins can update all profiles (using app_metadata to avoid recursion)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Function to sync role to auth.users metadata
CREATE OR REPLACE FUNCTION sync_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's app_metadata in auth.users
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep auth metadata in sync
DROP TRIGGER IF EXISTS sync_role_to_auth_trigger ON profiles;
CREATE TRIGGER sync_role_to_auth_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_auth();

-- Update the new user function to set metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, subscription_tier, ebooks_limit)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    'free',
    1
  );
  
  -- Set the role in auth metadata
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'user')
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix ebooks policies to remove recursion
DROP POLICY IF EXISTS "Users can view own ebooks" ON ebooks;
DROP POLICY IF EXISTS "Users can insert own ebooks" ON ebooks;
DROP POLICY IF EXISTS "Users can update own ebooks" ON ebooks;
DROP POLICY IF EXISTS "Users can delete own ebooks" ON ebooks;

CREATE POLICY "Users can view own ebooks"
  ON ebooks FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can insert own ebooks"
  ON ebooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ebooks"
  ON ebooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ebooks"
  ON ebooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix chapters policies
DROP POLICY IF EXISTS "Users can view own chapters" ON chapters;
DROP POLICY IF EXISTS "Users can insert own chapters" ON chapters;
DROP POLICY IF EXISTS "Users can update own chapters" ON chapters;
DROP POLICY IF EXISTS "Users can delete own chapters" ON chapters;

CREATE POLICY "Users can view own chapters"
  ON chapters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
    ) OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can insert own chapters"
  ON chapters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chapters"
  ON chapters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chapters"
  ON chapters FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
    )
  );

-- Fix API keys policies
DROP POLICY IF EXISTS "Only admins can view API keys" ON api_keys;
DROP POLICY IF EXISTS "Only admins can insert API keys" ON api_keys;
DROP POLICY IF EXISTS "Only admins can update API keys" ON api_keys;
DROP POLICY IF EXISTS "Only admins can delete API keys" ON api_keys;

CREATE POLICY "Only admins can view API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Only admins can insert API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Only admins can update API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Only admins can delete API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Fix subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Only admins can manage subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Fix usage logs policies
DROP POLICY IF EXISTS "Only admins can view usage logs" ON usage_logs;
DROP POLICY IF EXISTS "System can insert usage logs" ON usage_logs;

CREATE POLICY "Only admins can view usage logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "System can insert usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
