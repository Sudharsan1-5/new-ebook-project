# Database Setup Instructions

## Problem
Your exported PDFs are blank because the database tables don't exist or are empty. The app needs the `ebooks` and `chapters` tables to store and retrieve content.

## Solution: Apply Database Migrations

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   ```

2. **Link your project to Supabase**:
   ```bash
   cd d:\project-bolt-sb1-cpyievkt\project
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   Find your project ref in your Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

3. **Push migrations to your database**:
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL Execution in Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Open the migration file: `project/supabase/migrations/20251004141355_create_users_and_admin_system.sql`
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click **Run** to execute
8. Repeat for the second migration: `20251005044850_fix_rls_policies_and_admin.sql`

### Option 3: Using Supabase Studio (Local Development)

If you're running Supabase locally:
```bash
cd d:\project-bolt-sb1-cpyievkt\project
supabase start
supabase db reset
```

## Verify Tables Were Created

After running migrations, verify in Supabase Dashboard:
1. Go to **Table Editor**
2. You should see these tables:
   - profiles
   - ebooks
   - chapters ← **This is critical for content**
   - api_keys
   - subscriptions
   - usage_logs

## Configure API Keys

After tables are created, you need to add API keys:

1. Go to Supabase Dashboard → **Table Editor** → `api_keys` table
2. Insert rows for your API keys:
   - **Mistral AI**: service_name = 'mistral', api_key = 'YOUR_MISTRAL_KEY', is_active = true
   - **Stability AI**: service_name = 'stability_ai', api_key = 'YOUR_STABILITY_KEY', is_active = true

## Test the Application

1. Start your dev server:
   ```bash
   cd d:\project-bolt-sb1-cpyievkt\project
   npm run dev
   ```

2. Create a new eBook through the wizard
3. The content will be saved to the `chapters` table
4. Export to PDF - it should now contain content

## Troubleshooting

### If PDF is still blank:
1. Check browser console for errors
2. Verify chapters were saved:
   - Go to Supabase Dashboard → Table Editor → `chapters`
   - Look for rows with your ebook_id
   - Check that `content` field is not empty

### If you get authentication errors:
1. Make sure your `.env` file has correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### If API key errors:
1. Verify API keys are in the `api_keys` table
2. Check that `is_active` is set to `true`
3. Make sure your user has admin role to access API keys
