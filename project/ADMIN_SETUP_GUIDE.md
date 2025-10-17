# Admin Setup Guide - eBook SaaS Platform

## Overview

Your eBook Generator is now a complete SaaS platform with:
- **You** as the global admin managing everything
- **Users** who sign up and create eBooks
- **No API keys visible to users** - you manage them centrally
- **Subscription tiers** with usage limits
- **Complete admin panel** for managing the platform

## Initial Setup - Becoming Admin

### Step 1: Sign Up as First User
1. Launch the application
2. Sign up with your email and password
3. You'll be created as a regular user initially

### Step 2: Promote Yourself to Admin
You need to manually promote your account to admin in the Supabase database:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to "Table Editor"
3. Open the `profiles` table
4. Find your user record (by your email)
5. Edit the `role` column from `'user'` to `'admin'`
6. Save the changes
7. Refresh your application - you should now see the "Admin Panel" button

**Option B: Using SQL Editor**
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Step 3: Access Admin Panel
1. Log out and log back in (or refresh the page)
2. You'll now see an "Admin Panel" button in the top navigation
3. Click it to access the admin dashboard

## Admin Panel Features

### 1. API Key Management

**Adding API Keys (Required for Platform to Work)**

1. Go to Admin Panel → API Keys tab
2. Click "Add API Key"
3. Select service:
   - **Mistral AI** - for content generation (titles, outlines, chapters)
   - **Stability AI** - for cover image generation
4. Paste your API key
5. Click "Save Key"

**Where to Get API Keys:**

- **Mistral AI**: https://console.mistral.ai
  - Sign up for free account
  - Navigate to API Keys section
  - Create a new API key
  - Free tier available

- **Stability AI**: https://platform.stability.ai
  - Sign up for account
  - Go to Account → API Keys
  - Generate new key
  - Free tier available with credits

**Managing Keys:**
- **View**: Click the eye icon to reveal the full key
- **Edit**: Update an existing key
- **Enable/Disable**: Toggle keys on/off without deleting
- **Delete**: Remove keys permanently
- **Monitor Usage**: See how many times each key has been used

### 2. User Management

**View All Users:**
- See all registered users
- View their subscription tiers
- Check eBook creation limits and usage
- See join dates

**Manage Subscriptions:**
- Change user tier from dropdown:
  - **Free**: 1 eBook limit
  - **Basic**: 5 eBooks limit
  - **Pro**: 999 eBooks limit (unlimited)
- Limits are enforced automatically
- Users see their limits on dashboard

### 3. Analytics Dashboard

Monitor platform metrics:
- **Total Users**: Count of all registered users
- **Total API Keys**: Number of configured API keys
- **Total API Calls**: Sum of all API usage
- **Subscription Distribution**: Visual breakdown of user tiers

## User Experience (What Users See)

### Users Never See:
- API keys
- API key configuration
- Admin panel
- Other users' data
- Platform analytics
- Backend management

### Users Can:
1. **Sign up** with email/password or Google OAuth
2. **Create eBooks** through the wizard (up to their tier limit)
3. **See their limits** on the dashboard
4. **Export eBooks** as PDF or EPUB
5. **View their own projects** only

### User Wizard Flow:
1. Enter book details (topic, audience, tone)
2. AI generates title suggestions automatically
3. AI creates chapter outline
4. AI writes full content for all chapters
5. Choose formatting template
6. Export as PDF or EPUB

**No API key prompts - everything just works!**

## Subscription Tiers

### Free Tier (Default)
- 1 eBook limit
- All features available
- Watermark on exports (if enabled)

### Basic Tier ($9/month - suggested)
- 5 eBooks limit
- No watermark
- All features

### Pro Tier ($29/month - suggested)
- Unlimited eBooks (999 limit in database)
- Priority support
- All features

**Note:** Payment integration is structured but not yet active. You can manually change user tiers in the admin panel.

## Database Structure

### Key Tables:
- `profiles` - User profiles with roles and subscription info
- `api_keys` - Your API keys (admin only)
- `ebooks` - All user-created eBooks
- `chapters` - Chapter content for each eBook
- `subscriptions` - Payment tracking (ready for Stripe/Whop)
- `usage_logs` - API usage tracking for analytics

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only see their own data
- Only admins can access API keys
- Only admins can view all users
- All operations are logged

## Edge Functions (Backend API)

Two secure Edge Functions handle AI generation:

### 1. `generate-content`
- Retrieves your Mistral API key from database
- Handles title generation
- Creates chapter outlines
- Generates chapter content
- Logs usage automatically

### 2. `generate-cover`
- Retrieves your Stability AI key from database
- Generates cover images
- Handles different styles
- Logs usage automatically

**Security:** Functions require authentication and only retrieve active API keys.

## Monitoring & Maintenance

### Check API Usage:
1. Go to Admin Panel → API Keys
2. View usage count for each key
3. See last used timestamp

### Monitor User Growth:
1. Go to Admin Panel → Analytics
2. View total users and distribution
3. Track subscription tiers

### Manage Limits:
1. Go to Admin Panel → Users
2. Adjust individual user limits as needed
3. Upgrade/downgrade tiers manually

## Troubleshooting

### Users Can't Generate Content:
1. Check if Mistral API key is added and active
2. Verify key is valid (test in Mistral console)
3. Check usage logs for errors

### Users Can't Generate Covers:
1. Check if Stability AI key is added and active
2. Verify key has credits remaining
3. Check usage logs

### User Can't Create More eBooks:
1. Check their current tier and limit
2. Verify ebooks_created count
3. Upgrade their tier if appropriate

### Admin Panel Not Showing:
1. Verify your role is 'admin' in profiles table
2. Log out and log back in
3. Clear browser cache

## Best Practices

### API Key Management:
1. Start with one key per service
2. Monitor usage regularly
3. Rotate keys periodically for security
4. Keep backup keys ready
5. Disable unused keys instead of deleting

### User Management:
1. Start all users on free tier
2. Manually upgrade paying customers
3. Monitor for abuse (excessive API usage)
4. Set reasonable limits per tier

### Platform Monitoring:
1. Check analytics weekly
2. Monitor API usage daily
3. Review user feedback
4. Track subscription distribution

## Future Enhancements Ready

The platform is structured for:
- Stripe payment integration
- Whop subscription management
- Automated tier upgrades
- Usage-based billing
- Advanced analytics
- Email notifications
- Cover image storage in Supabase Storage
- Export history tracking

## Support & Documentation

### User-Facing Docs:
- README.md - General project overview
- EXPORT_GUIDE.md - How to export eBooks

### Technical Docs:
- IMPLEMENTATION_SUMMARY.md - Technical details
- Database migrations in Supabase
- Edge Functions deployed and running

---

## Quick Start Checklist

- [ ] Sign up as first user
- [ ] Promote yourself to admin in database
- [ ] Log back in and access Admin Panel
- [ ] Add Mistral AI API key
- [ ] Add Stability AI API key (optional)
- [ ] Test by creating an eBook as a regular user
- [ ] Monitor usage in Analytics tab
- [ ] Configure subscription tiers as needed

**You're now running a complete eBook SaaS platform!**
