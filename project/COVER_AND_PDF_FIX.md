# Cover Generation & PDF Export Fixes

## Summary
Fixed two critical issues:
1. **Stability AI Cover Generation** - Added user prompt input with color/branding controls
2. **PDF Export Failure** - Fixed blob conversion and html2pdf configuration

---

## 1. Cover Generation Improvements

### Changes Made

#### `src/components/EBookWizard.tsx`
- **Added User Prompt Section**: Users can now describe their vision for the cover
- **Color Customization**: Added primary and secondary color pickers for brand colors
- **Style Selection**: Users can choose between minimal, artistic, or professional styles
- **AI Integration**: The AI uses the book title as the main influence, with user tweaks for colors and branding
- **Proper Error Handling**: Shows clear error messages if Stability AI API is not configured

### Features Added
1. **Cover Prompt Input** - Optional text area for users to describe their cover vision
2. **Style Selector** - Three preset styles (minimal, artistic, professional)
3. **Brand Colors** - Two color pickers for primary and secondary brand colors
4. **Preview & Regenerate** - Users can view generated covers and regenerate if needed
5. **Skip Option** - Users can skip cover generation and add it later

### How It Works
```typescript
// The prompt is built from:
1. Book title (main influence)
2. User's custom description (optional)
3. Selected colors (primary & secondary)
4. Style preference (minimal/artistic/professional)
5. Tone from book settings
```

The cover generation now properly:
- Calls the Supabase Edge Function `generate-cover`
- Handles binary image responses (Blob/ArrayBuffer)
- Creates a local blob URL for preview
- Saves the cover URL to the database

---

## 2. PDF Export Fix

### Changes Made

#### `src/lib/export-pdf.ts`
- **Fixed Blob Conversion**: Changed from `outputPdf('blob')` to `output('blob')`
- **Added Width Constraint**: Set temp div width to A4 dimensions (210mm)
- **Window Width**: Added windowWidth parameter for proper rendering
- **Element Selection**: Improved body element selection with fallback

### Technical Fixes
```typescript
// Before (failing):
const pdfBlob = await html2pdf()
  .set(opt)
  .from(tempDiv.querySelector('body')!)
  .outputPdf('blob');

// After (working):
const bodyElement = tempDiv.querySelector('body') || tempDiv;
const pdfBlob = await html2pdf()
  .set(opt)
  .from(bodyElement)
  .output('blob');
```

### Additional Improvements
- Set proper A4 width (210mm) on temp container
- Added windowWidth: 794 (A4 width in pixels at 96 DPI)
- Fixed TypeScript type assertions for html2pdf options
- Improved error handling in ExportModal

---

## 3. Database Integration

### Changes Made

#### `src/pages/Dashboard.tsx`
- Added `cover_url` field to ebook insert
- Properly saves generated cover URL to database
- Cover persists across sessions

---

## Testing Checklist

### Cover Generation
- [ ] Navigate to eBook wizard
- [ ] Complete all steps until "Cover" step
- [ ] Enter custom cover description (optional)
- [ ] Select a style (minimal/artistic/professional)
- [ ] Choose brand colors
- [ ] Click "Generate Cover with AI"
- [ ] Verify cover appears
- [ ] Try "Generate New Cover" button
- [ ] Complete wizard and verify cover is saved

### PDF Export
- [ ] Open an existing eBook from dashboard
- [ ] Click the download/export button
- [ ] Select "Export as PDF"
- [ ] Verify PDF downloads successfully
- [ ] Open PDF and verify:
  - Cover page renders correctly
  - Table of contents is present
  - All chapters are included
  - Formatting is preserved

---

## Prerequisites

### Admin Setup Required
1. **Stability AI API Key**: Must be configured in Admin Panel
   - Navigate to Admin Panel
   - Add Stability AI API key
   - Service name: `stability_ai`
   - Mark as active

2. **Supabase Edge Function**: Ensure `generate-cover` function is deployed
   - Function should be in `supabase/functions/generate-cover/`
   - Properly configured with CORS headers
   - Has access to api_keys table

---

## Error Messages

### Cover Generation Errors
- **"Failed to generate cover. Please ensure Stability AI API is configured in the admin panel."**
  - Solution: Admin needs to add Stability AI API key in Admin Panel

- **"Unexpected response format from cover generation"**
  - Solution: Check Supabase Edge Function is returning proper binary data

### PDF Export Errors
- **"Failed to export PDF. Please try again."**
  - Solution: Check browser console for detailed errors
  - Verify html2pdf.js is properly loaded
  - Ensure chapters have content

---

## Known Limitations

1. **Cover URL Storage**: Currently stores blob URLs which are temporary. For production, consider:
   - Uploading generated covers to Supabase Storage
   - Converting to base64 data URLs
   - Using a CDN for permanent storage

2. **PDF Size**: Large eBooks (>100 pages) may take longer to export
   - Consider adding progress indicator
   - May need to optimize image quality settings

---

## Future Enhancements

1. **Cover Storage**: Upload generated covers to Supabase Storage for persistence
2. **Multiple Cover Options**: Generate 3-4 variations and let user choose
3. **Cover Templates**: Pre-designed templates users can customize
4. **PDF Customization**: Allow users to select fonts, colors, and layouts
5. **Progress Indicators**: Show progress during long PDF exports
