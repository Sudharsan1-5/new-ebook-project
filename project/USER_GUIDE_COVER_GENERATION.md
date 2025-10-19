# User Guide: AI Cover Generation

## Overview
The eBook Generator now includes AI-powered cover generation using Stability AI. You can create professional book covers with custom prompts, colors, and styles.

---

## How to Generate a Cover

### Step 1: Create Your eBook
1. Click **"Create New eBook"** from the dashboard
2. Complete the wizard steps:
   - Enter book topic, audience, and tone
   - Choose or customize your title
   - Review and edit chapter outline
   - Generate content
   - Select a template

### Step 2: Design Your Cover
When you reach the **"Cover"** step, you'll see:

#### 1. **Cover Description (Optional)**
- Describe your vision for the cover
- Examples:
  - "Modern design with geometric shapes"
  - "Vibrant sunset colors with minimalist tech theme"
  - "Professional business style with blue tones"
  - "Artistic watercolor background with nature elements"

**Note**: The AI will use your book title as the main influence. Your description helps refine the design.

#### 2. **Cover Style**
Choose one of three styles:
- **Minimal**: Clean, simple, modern with negative space
- **Artistic**: Creative, expressive, vibrant colors
- **Professional**: Corporate, polished, sophisticated

#### 3. **Brand Colors**
- **Primary Color**: Main color for your cover
- **Secondary Color**: Accent color for contrast
- Click the color boxes to open color pickers
- Default colors: Blue (#3B82F6) and Dark Blue (#1E40AF)

### Step 3: Generate
1. Click **"Generate Cover with AI"**
2. Wait 5-15 seconds for generation
3. Preview your cover

### Step 4: Regenerate (Optional)
If you're not satisfied:
1. Click **"Generate New Cover"**
2. Adjust your description, style, or colors
3. Generate again

### Step 5: Skip (Optional)
You can skip cover generation and add it later from the dashboard.

---

## Tips for Best Results

### Writing Effective Prompts
✅ **Good Prompts**:
- "Sunset gradient with mountain silhouette"
- "Tech-themed with circuit board patterns"
- "Elegant typography on solid background"
- "Nature photography with forest theme"

❌ **Avoid**:
- Don't include text/titles (AI generates image only)
- Don't be too vague ("nice cover")
- Don't request specific fonts or text placement

### Color Selection
- **Complementary Colors**: Use colors that work well together
- **Brand Consistency**: Match your existing brand colors
- **Contrast**: Ensure good contrast for readability
- **Psychology**: Consider color meanings:
  - Blue: Trust, professionalism
  - Green: Growth, health
  - Red: Energy, passion
  - Purple: Creativity, luxury

### Style Guide
| Style | Best For | Examples |
|-------|----------|----------|
| **Minimal** | Business, guides, technical | Productivity books, how-to guides |
| **Artistic** | Creative, fiction, journals | Novels, art books, memoirs |
| **Professional** | Corporate, academic | Business books, textbooks, reports |

---

## Troubleshooting

### "Failed to generate cover"
**Cause**: Stability AI API not configured

**Solution**:
1. Contact your administrator
2. Admin needs to add Stability AI API key in Admin Panel
3. Service name must be: `stability_ai`
4. API key must be marked as active

### Cover Not Saving
**Cause**: Database connection issue

**Solution**:
1. Ensure you complete the wizard
2. Click "Complete & Save to Dashboard"
3. Check your internet connection
4. Try regenerating the cover

### Cover Looks Different Than Expected
**Cause**: AI interpretation varies

**Solution**:
1. Be more specific in your description
2. Try different color combinations
3. Switch styles (minimal/artistic/professional)
4. Generate multiple times until satisfied

---

## Examples

### Example 1: Business Book
- **Title**: "Digital Marketing Mastery"
- **Description**: "Professional design with laptop and graphs"
- **Style**: Professional
- **Colors**: Navy Blue (#1E3A8A) + Light Blue (#60A5FA)

### Example 2: Self-Help Book
- **Title**: "Find Your Inner Peace"
- **Description**: "Calm meditation scene with soft gradients"
- **Style**: Minimal
- **Colors**: Teal (#14B8A6) + Soft Purple (#A78BFA)

### Example 3: Fiction Novel
- **Title**: "The Last Journey"
- **Description**: "Dramatic landscape with stormy sky"
- **Style**: Artistic
- **Colors**: Deep Red (#DC2626) + Dark Gray (#374151)

### Example 4: Technical Guide
- **Title**: "Python Programming Guide"
- **Description**: "Clean code-themed design with geometric patterns"
- **Style**: Minimal
- **Colors**: Green (#10B981) + Dark Blue (#1E40AF)

---

## FAQ

**Q: Can I upload my own cover instead?**
A: Currently, only AI generation is supported. Custom upload feature coming soon.

**Q: How long does generation take?**
A: Typically 5-15 seconds, depending on server load.

**Q: Can I edit the cover after generation?**
A: You can regenerate with different settings. Direct editing not yet available.

**Q: Is there a limit on cover generations?**
A: Limits depend on your subscription tier. Check with your administrator.

**Q: What image format is the cover?**
A: PNG format, optimized for print and digital use.

**Q: Can I download just the cover?**
A: Currently, covers are embedded in PDF/EPUB exports. Standalone download coming soon.

**Q: What resolution are the covers?**
A: High resolution suitable for both digital and print use.

---

## Need Help?

If you encounter issues:
1. Check this guide first
2. Contact your administrator for API configuration
3. Report bugs with screenshots and error messages
4. Check the browser console for technical details (F12)
