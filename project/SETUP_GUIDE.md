# Complete eBook Generator - Setup Guide

## Project Overview

This is a complete **AI-powered eBook generation platform** that allows users to create professional eBooks with just a title!

### What This App Does:

Instead of:
- Writing content in ChatGPT/Claude
- Formatting in Canva/Word
- Creating cover images separately
- Manually combining everything

**You just provide a title** and the app:
1. Generates complete book content using **Mistral AI**
2. Creates professional cover images using **Stability AI**
3. Exports to **PDF, EPUB, or 3D Mockup** formats
4. All in one seamless workflow!

## Features

- **AI Content Generation**: 8-chapter ebooks with 1500-2000 words per chapter
- **AI Cover Design**: Professional book covers with multiple styles
- **Multiple Export Formats**: PDF (Gumroad/Etsy), EPUB (Amazon KDP), 3D Mockups
- **User Authentication**: Secure login with email/password or Google OAuth
- **Subscription Tiers**: Free, Basic, and Pro plans
- **Admin Panel**: Manage API keys and monitor usage
- **Professional Templates**: Choose from multiple formatting styles

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI Services**: Mistral AI (content) + Stability AI (images)
- **Export**: html2pdf.js, jsPDF, jsZip

## Prerequisites

Before you begin, make sure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Supabase Account** - [Sign up free](https://supabase.com)
4. **Mistral AI API Key** - [Get it here](https://console.mistral.ai/)
5. **Stability AI API Key** - [Get it here](https://platform.stability.ai/)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd /home/user/new-ebook-project/project
npm install
```

### 2. Set Up Supabase

#### A. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready

#### B. Get Your Supabase Credentials

1. Go to Project Settings > API
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbG...`)

#### C. Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace placeholder values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### D. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents of `supabase/migrations/20251004141355_create_users_and_admin_system.sql`
4. Paste and click "Run"
5. Repeat for `supabase/migrations/20251005044850_fix_rls_policies_and_admin.sql`

#### E. Deploy Supabase Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy functions:
```bash
cd supabase
supabase functions deploy generate-content
supabase functions deploy generate-cover
```

5. Set environment secrets for edge functions:
```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set Up AI API Keys (Admin Panel)

1. Start the development server:
```bash
npm run dev
```

2. Open browser to `http://localhost:5173`

3. Sign up for a new account (first user)

4. **Make yourself admin**:
   - Go to Supabase dashboard > Table Editor > `profiles`
   - Find your user record
   - Change `role` from `user` to `admin`

5. Refresh the app and click "Admin Panel"

6. Add API keys:
   - **Mistral AI**: Add your Mistral API key
   - **Stability AI**: Add your Stability AI API key

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

## Usage Guide

### Creating Your First eBook

1. **Login/Signup** to your account

2. **Click "Create New eBook"**

3. **Step 1 - Input**:
   - Enter topic (e.g., "Digital Marketing for Beginners")
   - Select audience (e.g., "Entrepreneurs")
   - Choose tone (e.g., "Professional")

4. **Step 2 - Titles**:
   - AI generates 5 title suggestions
   - Select one or edit to customize

5. **Step 3 - Outline**:
   - AI creates 8-chapter outline
   - Review and edit chapter titles

6. **Step 4 - Content**:
   - Click "Generate All Chapters"
   - AI writes 1500-2000 words per chapter
   - Preview and edit content

7. **Step 5 - Template**:
   - Choose formatting style
   - Preview how it looks

8. **Step 6 - Cover**:
   - Describe cover theme and mood
   - AI generates professional cover image
   - Try different styles

9. **Step 7 - Export**:
   - **PDF**: For Gumroad, Etsy, Whop
   - **EPUB**: For Amazon KDP
   - **3D Mockup**: For marketing

## Project Structure

```
project/
├── src/
│   ├── components/       # React components
│   │   ├── EBookWizard.tsx    # Main creation wizard
│   │   ├── ExportModal.tsx    # Export functionality
│   │   └── ...
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx      # Main user interface
│   │   ├── AdminPanel.tsx     # Admin management
│   │   └── Login.tsx/SignUp.tsx
│   ├── lib/             # Utilities
│   │   ├── mistral.ts         # Mistral AI integration
│   │   ├── stabilityai.ts     # Stability AI integration
│   │   ├── export-pdf.ts      # PDF export
│   │   └── export-epub.ts     # EPUB export
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main app component
├── supabase/
│   ├── functions/       # Edge functions (Deno)
│   └── migrations/      # Database schema
└── package.json
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure `.env` file exists with correct values:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### Issue: "API key not configured"

**Solution**:
1. Make sure you're an admin
2. Go to Admin Panel
3. Add Mistral and Stability AI keys

### Issue: "Content generation failed"

**Solution**:
1. Check Mistral API key is valid
2. Check you have credits in Mistral account
3. Check edge function is deployed

### Issue: "Cover generation failed"

**Solution**:
1. Check Stability AI key is valid
2. Check you have credits in Stability account
3. Try different prompts/themes

## Support

For issues or questions:
1. Check the documentation files in the project
2. Review Supabase logs for edge function errors
3. Check browser console for frontend errors

## Credits

Built with:
- React + TypeScript + Vite
- Supabase
- Mistral AI
- Stability AI
- Tailwind CSS

---

**Happy eBook Creating!** 📚✨
