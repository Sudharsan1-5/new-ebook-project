# eBook Export Guide

## How the Export Feature Works

The download button on each eBook project card now opens a comprehensive export modal that allows you to download your eBook in multiple formats.

### Export Formats Available

#### 1. PDF Export
- **Best For**: Gumroad, Etsy, Whop, direct download sales
- **Features**:
  - Professional cover page with title and metadata
  - Clickable table of contents with page numbers
  - Formatted chapters with consistent styling
  - Page numbering throughout
  - Proper margins and typography
- **File Format**: `.pdf`
- **Use Case**: Perfect for selling as downloadable digital products

#### 2. EPUB Export
- **Best For**: Amazon KDP, e-readers (Kindle, Kobo, Apple Books)
- **Features**:
  - EPUB 3.0 standard compliant
  - Reflowable text that adapts to screen size
  - Embedded navigation (table of contents)
  - Proper metadata for publishing platforms
  - Multiple reading modes support
  - Responsive typography
- **File Format**: `.epub`
- **Use Case**: Publishing on Amazon and other eBook platforms

#### 3. 3D Mockup Export (Coming Soon)
- **Best For**: Marketing, product listings, social media
- **Features**:
  - High-resolution 3D book mockup image
  - Professional presentation
  - Ready for use in ads and listings
- **File Format**: `.png` or `.jpg`
- **Note**: Requires cover image generation first

## How to Use the Export Feature

### Step 1: Create an eBook
1. Click "Create New eBook" on the dashboard
2. Complete all wizard steps
3. Click "Complete & Save to Dashboard"

### Step 2: Access Export Modal
1. Find your eBook in the dashboard
2. Click the download icon button on the eBook card
3. The export modal will open

### Step 3: Choose Format
1. Click on your desired export format (PDF or EPUB)
2. The file will automatically generate and download
3. The file will be saved with your eBook title as the filename

### Step 4: Use Your eBook
- **For Gumroad/Etsy**: Upload the PDF file as your digital product
- **For Amazon KDP**: Upload the EPUB file through the KDP dashboard
- **For Whop**: Use the PDF in your digital product setup

## Technical Details

### PDF Generation
The PDF exporter uses jsPDF to create professional-quality documents with:
- Custom fonts and styling based on selected template
- Automatic page breaks
- Text wrapping and formatting
- Clickable internal links for table of contents
- Proper document structure for compatibility

### EPUB Generation
The EPUB exporter creates standards-compliant files with:
- Proper XML structure (mimetype, container.xml, content.opf)
- XHTML content files for each chapter
- CSS styling for consistent appearance
- Navigation document for e-reader menus
- Metadata for library organization

### File Naming
Files are automatically named using your eBook title with:
- Special characters replaced with underscores
- Spaces converted to underscores
- Proper file extension (.pdf or .epub)

Example: "The Complete Guide to Digital Marketing" becomes:
- `The_Complete_Guide_to_Digital_Marketing.pdf`
- `The_Complete_Guide_to_Digital_Marketing.epub`

## Troubleshooting

### Export Not Working
- **Check browser console** for error messages
- **Ensure eBook has chapters** with content
- **Try a different format** (PDF vs EPUB)
- **Refresh the page** and try again

### File Won't Open
- **PDF issues**: Try with Adobe Reader, Preview, or Chrome
- **EPUB issues**: Try with Calibre, Apple Books, or upload to Amazon KDP directly
- **Verify file size**: Should be several KB to MB depending on content length

### Upload to Marketplace Issues
- **Amazon KDP**: Use EPUB format, ensure metadata is complete
- **Gumroad**: Use PDF format, set download limit and price
- **Etsy**: Use PDF format as digital download, set instant delivery

## Best Practices

### Before Exporting
1. Review all chapter content for completeness
2. Check chapter titles for consistency
3. Verify word count meets your goals
4. Ensure formatting template is appropriate

### After Exporting
1. Open and review the exported file
2. Check table of contents links (PDF)
3. Test reflowable text (EPUB)
4. Verify all chapters are present
5. Check formatting on multiple devices

### For Marketplace Sales
1. **Create a compelling product description**
2. **Add high-quality cover image** (or use mockup when available)
3. **Set appropriate price point** based on length and topic
4. **Include preview pages** in your listing
5. **Test the download process** before launching

## Future Enhancements

Coming soon to the export feature:
- Custom watermarks for different tiers
- Batch export multiple formats at once
- Export history with re-download capability
- Cover image overlay editor
- 3D mockup generator
- Custom branding options
- Multiple template choices per export

---

**Need Help?** The export feature is designed to be simple and automatic. If you encounter issues, check this guide first, then refer to the main README for more technical details.
