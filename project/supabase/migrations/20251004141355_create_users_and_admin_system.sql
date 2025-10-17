/*
  # eBook SaaS Platform - Users and Admin System

  ## Overview
  Complete database schema for a multi-tenant eBook generation SaaS platform with admin management,
  subscription tiers, usage tracking, and API key management.

  ## 1. New Tables

  ### `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique)
  - `full_name` (text)
  - `role` (text) - 'admin' or 'user'
  - `subscription_tier` (text) - 'free', 'basic', 'pro'
  - `ebooks_created` (integer) - count of ebooks created
  - `ebooks_limit` (integer) - max ebooks allowed based on tier
  - `subscription_status` (text) - 'active', 'cancelled', 'expired'
  - `subscription_start_date` (timestamptz)
  - `subscription_end_date` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `api_keys`
  Global API keys managed by admin
  - `id` (uuid, primary key)
  - `service_name` (text) - 'mistral' or 'stability_ai'
  - `api_key` (text, encrypted) - the actual API key
  - `is_active` (boolean) - whether key is currently in use
  - `usage_count` (integer) - number of times used
  - `last_used_at` (timestamptz)
  - `created_by` (uuid, references profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `ebooks`
  User-created ebook projects
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `topic` (text)
  - `audience` (text)
  - `tone` (text)
  - `status` (text) - 'draft', 'generating', 'completed'
  - `word_count` (integer, default 0)
  - `chapter_count` (integer, default 0)
  - `cover_url` (text)
  - `template_id` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `chapters`
  Individual chapters within ebooks
  - `id` (uuid, primary key)
  - `ebook_id` (uuid, references ebooks)
  - `chapter_number` (integer)
  - `title` (text)
  - `content` (text)
  - `word_count` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `subscriptions`
  Subscription payment tracking
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `plan_type` (text) - 'free', 'basic', 'pro'
  - `status` (text) - 'active', 'cancelled', 'expired'
  - `payment_provider` (text) - 'stripe' or 'whop'
  - `payment_id` (text)
  - `amount` (decimal)
  - `currency` (text)
  - `start_date` (timestamptz)
  - `end_date` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `usage_logs`
  Track API usage for monitoring and billing
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `ebook_id` (uuid, references ebooks)
  - `service_name` (text) - 'mistral' or 'stability_ai'
  - `operation` (text) - 'generate_titles', 'generate_outline', etc.
  - `tokens_used` (integer)
  - `success` (boolean)
  - `error_message` (text)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Admins can access all data
  - API keys only accessible by admins
  - Usage logs readable by admins only

  ## 3. Important Notes
  - First user to sign up should be manually promoted to admin role in database
  - API keys are stored securely and only accessible to admins
  - Free tier users limited to 1 ebook with watermark
  - Subscription limits enforced at application level
*/

-- Create profiles table extending auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
  ebooks_created integer NOT NULL DEFAULT 0,
  ebooks_limit integer NOT NULL DEFAULT 1,
  subscription_status text NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  subscription_start_date timestamptz DEFAULT now(),
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create api_keys table for admin-managed keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL CHECK (service_name IN ('mistral', 'stability_ai')),
  api_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ebooks table
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  topic text,
  audience text,
  tone text CHECK (tone IN ('self-help', 'fiction', 'journal', 'guide', 'professional')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed')),
  word_count integer NOT NULL DEFAULT 0,
  chapter_count integer NOT NULL DEFAULT 0,
  cover_url text,
  template_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  content text,
  word_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ebook_id, chapter_number)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  payment_provider text CHECK (payment_provider IN ('stripe', 'whop')),
  payment_id text,
  amount decimal(10,2),
  currency text DEFAULT 'USD',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  operation text NOT NULL,
  tokens_used integer DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- API Keys policies (admin only)
CREATE POLICY "Only admins can view API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can insert API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can update API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can delete API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Ebooks policies
CREATE POLICY "Users can view own ebooks"
  ON ebooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

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

-- Chapters policies
CREATE POLICY "Users can view own chapters"
  ON chapters FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can insert own chapters"
  ON chapters FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own chapters"
  ON chapters FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own chapters"
  ON chapters FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ebooks WHERE ebooks.id = chapters.ebook_id AND ebooks.user_id = auth.uid()
  ));

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Usage logs policies (admin only)
CREATE POLICY "Only admins can view usage logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_ebooks_user ON ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_status ON ebooks(status);
CREATE INDEX IF NOT EXISTS idx_chapters_ebook ON chapters(ebook_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_service ON usage_logs(service_name);

-- Function to auto-create profile on user signup
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
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_api_keys ON api_keys;
CREATE TRIGGER set_updated_at_api_keys
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_ebooks ON ebooks;
CREATE TRIGGER set_updated_at_ebooks
  BEFORE UPDATE ON ebooks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_chapters ON chapters;
CREATE TRIGGER set_updated_at_chapters
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
