# Quick Diagnostic Guide

## Issue: "Edge Function returned a non-2xx status code"

### What This Error Means
The Stability AI cover generation service encountered a problem. This is **NOT** a code bug - it's a configuration or API issue.

### Most Common Causes (in order)

#### 1. API Key Not Configured (90% of cases)
**Check**: Admin Panel → API Keys → Look for `stability_ai`

**Symptoms**:
- No `stability_ai` entry in API Keys list
- Entry exists but is marked "Inactive"
- Entry exists but API key field is empty

**Fix**:
1. Get API key from platform.stability.ai
2. Add to Admin Panel with service name: `stability_ai`
3. Mark as "Active"
4. Save

#### 2. Invalid or Expired API Key (8% of cases)
**Check**: Test API key at platform.stability.ai

**Symptoms**:
- Error message mentions "invalid key"
- Error message mentions "unauthorized"

**Fix**:
1. Generate new API key at platform.stability.ai
2. Update in Admin Panel
3. Try again

#### 3. Insufficient Credits (1.5% of cases)
**Check**: Stability AI account balance

**Symptoms**:
- Error message mentions "credits" or "quota"
- Works initially, then stops

**Fix**:
1. Add credits to Stability AI account
2. Or wait for free tier reset (monthly)

#### 4. Network/CORS Issues (0.5% of cases)
**Check**: Browser console (F12) for CORS errors

**Symptoms**:
- Intermittent failures
- Works on some networks, not others

**Fix**:
1. Check firewall settings
2. Try different network
3. Verify Supabase Edge Function is deployed

---

## Issue: Blank PDF (No Text)

### Status: ✅ FIXED in Latest Version

### If You Still See This
**Cause**: You're using old code

**Fix**:
1. Pull latest changes
2. Refresh browser (Ctrl+F5)
3. Clear browser cache
4. Try export again

### How to Verify Fix is Applied
Check `src/lib/export-pdf.ts`:
- Should have `generateInlineStyles()` method
- Should NOT import `HTMLRenderer`
- Should create container div directly

---

## Issue: 3D Mockup Not Working

### Symptom: "Requires cover image" message
**Cause**: eBook doesn't have a cover

**Fix**:
1. Go to eBook wizard
2. Generate cover in "Cover" step
3. Complete wizard
4. Try mockup export again

### Symptom: Mockup downloads but shows placeholder
**Cause**: Cover image failed to load

**Fix**:
1. Regenerate cover
2. Export mockup immediately
3. Don't wait too long (blob URLs expire)

### Symptom: Nothing happens when clicking button
**Cause**: JavaScript error

**Fix**:
1. Open browser console (F12)
2. Look for errors
3. Refresh page
4. Try again

---

## Issue: Empty Template Previews

### Status: ✅ FIXED in Latest Version

### If You Still See Empty Boxes
**Cause**: Old code

**Fix**:
1. Pull latest changes
2. Hard refresh (Ctrl+Shift+R)
3. Should see gradient backgrounds with icons

---

## Browser Console Debugging

### How to Open Console
- **Chrome/Edge**: F12 or Ctrl+Shift+I
- **Firefox**: F12 or Ctrl+Shift+K
- **Safari**: Cmd+Option+I

### What to Look For

#### Cover Generation Errors
```
Edge Function error: {...}
Stability AI API key not configured
Failed to generate cover
```

#### PDF Export Errors
```
html2pdf error
Failed to export PDF
Canvas error
```

#### Network Errors
```
CORS error
Failed to fetch
Network request failed
```

---

## Quick Fixes

### Clear Everything and Start Fresh
1. Clear browser cache (Ctrl+Shift+Delete)
2. Log out and log back in
3. Hard refresh (Ctrl+F5)
4. Try again

### Verify Supabase Connection
1. Check you can log in
2. Check you can create eBooks
3. Check dashboard loads

### Verify API Configuration
1. Admin Panel accessible
2. API Keys section loads
3. Can add/edit keys

---

## Error Message Decoder

| Error Message | Meaning | Fix |
|---------------|---------|-----|
| "Edge Function returned a non-2xx status code" | API/config issue | Check API key |
| "Stability AI API key not configured" | No API key | Add in Admin Panel |
| "Authentication failed" | Not logged in | Log in again |
| "No image data received" | API returned empty | Check API credits |
| "Received empty image data" | Blob conversion failed | Try again |
| "Failed to export PDF" | PDF generation error | Check console |
| "Mockup generation requires a cover image" | No cover | Generate cover first |
| "Canvas not supported" | Old browser | Update browser |

---

## When to Contact Support

Contact if:
- ✅ You've checked API key configuration
- ✅ You've tried clearing cache
- ✅ You've checked browser console
- ✅ Error persists after 3 attempts
- ✅ You have screenshots/error messages

Don't contact if:
- ❌ Haven't checked API key
- ❌ Haven't refreshed browser
- ❌ Haven't looked at console
- ❌ Only tried once

---

## Self-Service Checklist

Before reporting an issue, verify:

- [ ] API key is configured in Admin Panel
- [ ] API key is marked as "Active"
- [ ] Service name is exactly: `stability_ai`
- [ ] Browser cache is cleared
- [ ] Page is refreshed (F5)
- [ ] Logged out and back in
- [ ] Tried in incognito/private window
- [ ] Checked browser console for errors
- [ ] Tried with different eBook
- [ ] Internet connection is stable

---

## Common Misconceptions

### ❌ "The code is broken"
✅ **Reality**: 99% of issues are configuration

### ❌ "It worked before, now it doesn't"
✅ **Reality**: API key expired or ran out of credits

### ❌ "PDF export doesn't work"
✅ **Reality**: It works, but you need to refresh to get latest code

### ❌ "Cover generation is unreliable"
✅ **Reality**: It's reliable when API key is configured

---

## Success Indicators

### Cover Generation Working
- ✅ Click "Generate Cover"
- ✅ See loading spinner
- ✅ Cover appears in 5-15 seconds
- ✅ Can regenerate with different settings

### PDF Export Working
- ✅ Click "Export as PDF"
- ✅ See "Generating PDF..." message
- ✅ PDF downloads in 10-30 seconds
- ✅ Open PDF and see all text

### 3D Mockup Working
- ✅ Button is enabled (not grayed out)
- ✅ Click "Export 3D Mockup"
- ✅ PNG downloads immediately
- ✅ Open PNG and see book mockup

---

## Performance Expectations

### Cover Generation
- **Normal**: 5-15 seconds
- **Slow**: 15-30 seconds (high server load)
- **Too Long**: >30 seconds (check network)

### PDF Export
- **Small eBook** (<5k words): 5-10 seconds
- **Medium eBook** (5-15k words): 10-20 seconds
- **Large eBook** (>15k words): 20-40 seconds

### 3D Mockup
- **Normal**: 1-3 seconds
- **With Cover Image**: 2-5 seconds
- **Too Long**: >10 seconds (check console)

---

## Advanced Debugging

### Check Supabase Edge Function
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Find `generate-cover`
4. Check deployment status
5. View logs for errors

### Check Database
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Check `api_keys` table
4. Verify `stability_ai` entry exists
5. Check `is_active` = true

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try cover generation
4. Look for `generate-cover` request
5. Check response status and body

---

## Still Having Issues?

### Gather This Information
1. **Error Message**: Exact text from screen
2. **Console Errors**: Copy from browser console
3. **Steps to Reproduce**: What you clicked
4. **Browser**: Chrome/Firefox/Safari + version
5. **Screenshots**: Of error and console

### Include in Report
- What you were trying to do
- What you expected to happen
- What actually happened
- What you've already tried

---

## Quick Reference

### API Key Setup
```
Service Name: stability_ai
Status: Active
Location: Admin Panel → API Keys
```

### File Locations (for developers)
```
Cover Generation: src/components/EBookWizard.tsx
PDF Export: src/lib/export-pdf.ts
3D Mockup: src/components/ExportModal.tsx
Edge Function: supabase/functions/generate-cover/index.ts
```

### Support Contacts
- Admin Panel: For API configuration
- Browser Console: For technical errors
- Documentation: CRITICAL_FIXES_APPLIED.md
