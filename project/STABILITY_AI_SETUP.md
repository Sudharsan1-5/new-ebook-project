# Stability AI Setup Guide

## Overview
This guide helps administrators configure the Stability AI API for cover generation in the eBook Generator.

---

## Prerequisites

1. **Stability AI Account**: Sign up at [stability.ai](https://stability.ai)
2. **API Credits**: Purchase API credits or use free tier
3. **Admin Access**: You must have admin role in the eBook Generator

---

## Step 1: Get Your Stability AI API Key

### Option A: Stability AI Platform
1. Go to [platform.stability.ai](https://platform.stability.ai)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create API Key"**
5. Copy the generated key (starts with `sk-...`)
6. **Important**: Save this key securely - it won't be shown again

### Option B: DreamStudio
1. Go to [dreamstudio.ai](https://dreamstudio.ai)
2. Sign up or log in
3. Click on your profile (top right)
4. Select **"API Keys"**
5. Generate a new API key
6. Copy and save the key

---

## Step 2: Add API Key to eBook Generator

### Access Admin Panel
1. Log in to the eBook Generator
2. Click **"Admin Panel"** button (top right)
   - Only visible if you have admin role
3. Navigate to **"API Keys"** section

### Add the Key
1. Click **"Add New API Key"** button
2. Fill in the form:
   - **Service Name**: `stability_ai` (exactly as shown)
   - **API Key**: Paste your Stability AI key
   - **Status**: Check "Active"
3. Click **"Save"**

### Verify Setup
- The key should appear in the list
- Status should show as "Active" (green)
- Service name must be exactly: `stability_ai`

---

## Step 3: Test Cover Generation

1. Create a new eBook or open existing one
2. Navigate to the "Cover" step in the wizard
3. Enter a simple description: "Blue gradient background"
4. Click **"Generate Cover with AI"**
5. Wait 5-15 seconds
6. Cover should appear

### If It Works
✅ Setup complete! Users can now generate covers.

### If It Fails
❌ See Troubleshooting section below

---

## API Key Management

### View Usage
- The admin panel shows:
  - Total API calls made
  - Last used timestamp
  - Success/failure rate

### Update API Key
1. Click **"Edit"** next to the key
2. Enter new API key
3. Click **"Update"**

### Deactivate Key
1. Click **"Edit"** next to the key
2. Uncheck "Active"
3. Click **"Update"**
- Users will see error message when trying to generate covers

### Delete Key
1. Click **"Delete"** next to the key
2. Confirm deletion
- **Warning**: This cannot be undone

---

## Troubleshooting

### Error: "Stability AI API key not configured"

**Cause**: No active API key found

**Solutions**:
1. Verify service name is exactly: `stability_ai` (lowercase, underscore)
2. Check the key is marked as "Active"
3. Ensure you saved the key after adding it

### Error: "Invalid API key or insufficient credits"

**Cause**: API key is invalid or account has no credits

**Solutions**:
1. Verify the API key is correct (copy-paste again)
2. Check your Stability AI account has credits
3. Try generating a new API key
4. Ensure the key hasn't expired

### Error: "Stability AI error: [message]"

**Cause**: API request failed

**Solutions**:
1. Check Stability AI service status
2. Verify your account is in good standing
3. Check rate limits haven't been exceeded
4. Review error message for specific details

### Cover Generation Takes Too Long

**Cause**: High server load or slow connection

**Solutions**:
1. Wait up to 30 seconds
2. Try again during off-peak hours
3. Check your internet connection
4. Contact Stability AI support if persistent

---

## API Costs & Limits

### Pricing (as of 2024)
- **Free Tier**: Limited credits for testing
- **Pay-as-you-go**: ~$0.01-0.04 per image
- **Subscription**: Monthly plans available

### Rate Limits
- **Free Tier**: ~50 images/day
- **Paid Tier**: Higher limits based on plan
- Check current limits at [stability.ai/pricing](https://stability.ai/pricing)

### Cost Optimization
1. **Monitor Usage**: Check admin panel regularly
2. **Set Limits**: Consider implementing user quotas
3. **Cache Results**: Save generated covers to reduce regenerations
4. **Quality Settings**: Balance quality vs cost

---

## Security Best Practices

### Protecting Your API Key
1. **Never Share**: Don't share your API key publicly
2. **Rotate Regularly**: Change keys every 3-6 months
3. **Monitor Usage**: Watch for unexpected usage spikes
4. **Restrict Access**: Only give admin access to trusted users

### Database Security
- API keys are stored in Supabase database
- Only admins can view/edit keys
- Keys are transmitted over HTTPS
- Consider encrypting keys at rest (advanced)

---

## Advanced Configuration

### Custom Models
The system uses Stability AI's Core model by default. To use different models:

1. Edit `supabase/functions/generate-cover/index.ts`
2. Change the API URL:
```typescript
// Current (Core model):
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';

// For SD3:
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

// For Ultra:
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/ultra';
```
3. Redeploy the Edge Function

### Aspect Ratios
Current default: 2:3 (book cover ratio)

Available ratios:
- `1:1` - Square
- `16:9` - Widescreen
- `21:9` - Ultrawide
- `2:3` - Portrait (book cover)
- `3:2` - Landscape
- `4:5` - Portrait
- `5:4` - Landscape
- `9:16` - Vertical
- `9:21` - Tall vertical

### Output Format
Current: PNG (best quality)

Options:
- `png` - Best quality, larger file
- `jpeg` - Smaller file, slight quality loss
- `webp` - Modern format, good compression

---

## Monitoring & Analytics

### Usage Logs
The system tracks:
- User ID who generated cover
- Timestamp
- Success/failure status
- Service used (stability_ai)

### View Logs
1. Go to Admin Panel
2. Navigate to "Usage Logs" section
3. Filter by:
   - Date range
   - User
   - Service
   - Status (success/failure)

### Export Data
- Download usage reports as CSV
- Analyze costs and usage patterns
- Identify heavy users

---

## Support

### Stability AI Support
- Documentation: [platform.stability.ai/docs](https://platform.stability.ai/docs)
- Discord: [discord.gg/stablediffusion](https://discord.gg/stablediffusion)
- Email: support@stability.ai

### eBook Generator Support
- Check documentation in project folder
- Review error logs in browser console (F12)
- Contact system administrator

---

## Checklist

Before going live, ensure:

- [ ] Stability AI API key obtained
- [ ] API key added to admin panel
- [ ] Service name is exactly: `stability_ai`
- [ ] Key is marked as "Active"
- [ ] Test cover generation successful
- [ ] Usage monitoring set up
- [ ] Users informed about feature
- [ ] Budget/limits established
- [ ] Backup API key generated (optional)
- [ ] Documentation shared with team

---

## Quick Reference

| Task | Location | Action |
|------|----------|--------|
| Get API Key | platform.stability.ai | Create API Key |
| Add to System | Admin Panel > API Keys | Add New |
| Service Name | API Key Form | `stability_ai` |
| Test Feature | Create eBook > Cover Step | Generate Cover |
| View Usage | Admin Panel > Usage Logs | Filter & View |
| Update Key | Admin Panel > API Keys | Edit |
| Deactivate | Admin Panel > API Keys | Edit > Uncheck Active |

---

## Updates & Maintenance

### Regular Tasks
- **Weekly**: Check usage logs
- **Monthly**: Review costs and limits
- **Quarterly**: Rotate API keys
- **Yearly**: Review and update documentation

### Version Updates
When updating the eBook Generator:
1. Backup current API keys
2. Test cover generation after update
3. Verify Edge Function still works
4. Check for any breaking changes

---

## Conclusion

With Stability AI properly configured, users can generate professional book covers in seconds. Monitor usage, manage costs, and provide support as needed.

For questions or issues, refer to the troubleshooting section or contact support.
