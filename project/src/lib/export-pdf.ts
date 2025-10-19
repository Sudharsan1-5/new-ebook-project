import html2pdf from 'html2pdf.js';
import { EBook, Chapter, Template } from '../types';

export class PDFExporter {
  async exportEBook(
    ebook: EBook,
    chapters: Chapter[],
    template: Template,
    includeCover: boolean = false,
    coverImageUrl?: string
  ): Promise<Blob> {
    console.log('Starting PDF export...');
    console.log('eBook:', ebook.title);
    console.log('Chapters:', chapters.length);
    console.log('Include cover:', includeCover);
    console.log('Cover URL:', coverImageUrl);
    
    // Validate chapters have content
    if (!chapters || chapters.length === 0) {
      throw new Error('No chapters to export');
    }
    
    const hasContent = chapters.some(ch => ch.content && ch.content.trim().length > 0);
    if (!hasContent) {
      throw new Error('Chapters have no content');
    }
    
    console.log('Chapters validated, generating HTML...');
    
    // Create a container div for the content
    const container = document.createElement('div');
    container.className = 'pdf-export-container';
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    container.style.background = 'white';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.zIndex = '-1000';
    container.style.opacity = '0.01'; // Slightly visible for rendering
    container.style.pointerEvents = 'none';
    container.style.overflow = 'visible';
    
    // Generate the content
    const styles = this.generateInlineStyles(template);
    const content = await this.generateContent(ebook, chapters, includeCover, coverImageUrl);
    
    console.log('Content generated, length:', content.length);
    
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    
    // Set the content
    container.innerHTML = content;
    container.insertBefore(styleElement, container.firstChild);
    
    document.body.appendChild(container);
    
    console.log('Container added to DOM');

    try {
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `${ebook.title}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 794,
          logging: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.chapter',
          after: ['.cover-page', '.toc-page']
        }
      } as any;

      // Wait for fonts to load
      console.log('Waiting for fonts...');
      await document.fonts.ready;
      
      // Wait for images to load if cover is included
      if (includeCover && coverImageUrl) {
        console.log('Waiting for cover image to load...');
        const images = container.getElementsByTagName('img');
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => {
                console.warn('Image failed to load:', img.src);
                resolve(); // Continue anyway
              };
              setTimeout(() => resolve(), 5000); // Timeout after 5s
            });
          })
        );
      }
      
      // Longer delay to ensure rendering is complete
      console.log('Waiting for rendering...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Generating PDF...');

      // Generate PDF and return as blob
      const pdfBlob = await html2pdf()
        .set(opt)
        .from(container)
        .output('blob');
      
      console.log('PDF generated, size:', pdfBlob.size, 'bytes');

      return pdfBlob;
    } finally {
      document.body.removeChild(container);
    }
  }

  private generateInlineStyles(template: Template): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body, .pdf-container, .pdf-export-container {
        font-family: ${template.styles.fontFamily}, Georgia, serif;
        font-size: ${template.styles.fontSize.body}pt;
        line-height: ${template.styles.lineHeight.body};
        color: ${template.styles.colors.text};
        background: white;
      }
      
      .cover-image-page {
        width: 100%;
        height: 297mm;
        display: flex;
        align-items: center;
        justify-content: center;
        page-break-after: always;
        background: white;
        padding: 0;
        margin: 0;
      }
      
      .cover-image {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
      }

      .cover-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        page-break-after: always;
        padding: 60px 40px;
      }

      .cover-title {
        font-size: 48pt;
        font-weight: bold;
        color: ${template.styles.colors.heading};
        margin-bottom: 30px;
        line-height: 1.2;
      }

      .cover-subtitle {
        font-size: 18pt;
        color: ${template.styles.colors.text};
        opacity: 0.8;
      }

      .toc-page {
        page-break-after: always;
        padding: 40px 0;
      }

      .toc-title {
        font-size: 36pt;
        font-weight: bold;
        color: ${template.styles.colors.heading};
        margin-bottom: 40px;
      }

      .toc-item {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 16px;
        font-size: 14pt;
        line-height: 1.5;
      }

      .toc-chapter {
        flex: 1;
        padding-right: 12px;
      }

      .toc-dots {
        flex-grow: 1;
        border-bottom: 1px dotted #ccc;
        height: 0.8em;
        margin: 0 8px;
      }

      .toc-page-num {
        font-weight: 500;
        color: ${template.styles.colors.heading};
      }

      .chapter {
        page-break-before: always;
        padding: 40px 0;
        min-height: 80vh;
      }

      .chapter:first-of-type {
        page-break-before: auto;
      }

      .chapter-title {
        font-size: ${template.styles.fontSize.heading}pt;
        font-weight: bold;
        color: ${template.styles.colors.heading};
        margin-bottom: 32px;
        line-height: ${template.styles.lineHeight.heading};
        border-bottom: 2px solid ${template.styles.colors.heading};
        padding-bottom: 16px;
      }

      .chapter-content {
        font-size: ${template.styles.fontSize.body}pt;
        line-height: ${template.styles.lineHeight.body};
        color: ${template.styles.colors.text};
      }

      .chapter-content p {
        margin-bottom: 20px;
        text-align: justify;
      }

      .chapter-content h2 {
        font-size: 20pt;
        font-weight: bold;
        color: ${template.styles.colors.heading};
        margin: 32px 0 16px 0;
      }

      .chapter-content h3 {
        font-size: 16pt;
        font-weight: 600;
        color: ${template.styles.colors.heading};
        margin: 24px 0 12px 0;
      }

      .chapter-content ul,
      .chapter-content ol {
        margin: 16px 0 16px 32px;
      }

      .chapter-content li {
        margin-bottom: 8px;
      }

      @media print {
        .cover-page,
        .toc-page,
        .chapter {
          page-break-after: always;
        }
      }
    `;
  }

  private async generateContent(
    ebook: EBook, 
    chapters: Chapter[], 
    includeCover: boolean,
    coverImageUrl?: string
  ): Promise<string> {
    let content = '';
    
    // Add cover image page if requested
    if (includeCover && coverImageUrl) {
      content += this.generateCoverImagePage(coverImageUrl, ebook.title);
    }
    
    // Add title page
    content += this.generateCoverPage(ebook);
    
    // Add table of contents
    content += this.generateTableOfContents(chapters);
    
    // Add chapters
    const chapterPages = chapters.map(chapter => this.generateChapter(chapter)).join('\n');
    content += chapterPages;

    return content;
  }
  
  private generateCoverImagePage(imageUrl: string, title: string): string {
    return `
<div class="cover-image-page">
  <img src="${imageUrl}" alt="${this.escapeHtml(title)} Cover" class="cover-image" crossorigin="anonymous" />
</div>
    `.trim();
  }

  private generateCoverPage(ebook: EBook): string {
    return `
<div class="cover-page">
  <h1 class="cover-title">${this.escapeHtml(ebook.title)}</h1>
  <p class="cover-subtitle">${this.escapeHtml(ebook.audience || '')} • ${this.escapeHtml(ebook.tone || '')}</p>
</div>
    `.trim();
  }

  private generateTableOfContents(chapters: Chapter[]): string {
    const tocItems = chapters.map((chapter, index) => {
      const pageNum = index + 3;
      return `
<div class="toc-item">
  <span class="toc-chapter">Chapter ${chapter.chapter_number}: ${this.escapeHtml(chapter.title)}</span>
  <span class="toc-dots"></span>
  <span class="toc-page-num">${pageNum}</span>
</div>
      `.trim();
    }).join('\n');

    return `
<div class="toc-page">
  <h2 class="toc-title">Table of Contents</h2>
  ${tocItems}
</div>
    `.trim();
  }

  private generateChapter(chapter: Chapter): string {
    const formattedContent = this.formatContent(chapter.content);

    return `
<div class="chapter">
  <h2 class="chapter-title">Chapter ${chapter.chapter_number}: ${this.escapeHtml(chapter.title)}</h2>
  <div class="chapter-content">
    ${formattedContent}
  </div>
</div>
    `.trim();
  }

  private formatContent(content: string): string {
    if (!content || content.trim() === '') {
      console.warn('Empty content detected');
      return '<p class="no-content">No content available.</p>';
    }

    console.log('Formatting content, length:', content.length);
    
    // Split by double newlines for paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    console.log('Paragraphs found:', paragraphs.length);

    const formatted = paragraphs.map((paragraph) => {
      const trimmed = paragraph.trim();

      // Headers
      if (trimmed.startsWith('## ')) {
        return `<h2>${this.escapeHtml(trimmed.substring(3))}</h2>`;
      }

      if (trimmed.startsWith('### ')) {
        return `<h3>${this.escapeHtml(trimmed.substring(4))}</h3>`;
      }
      
      if (trimmed.startsWith('# ')) {
        return `<h2>${this.escapeHtml(trimmed.substring(2))}</h2>`;
      }

      // Unordered lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const item = line.replace(/^[*\-]\s+/, '');
            return `<li>${this.escapeHtml(item)}</li>`;
          })
          .join('\n');
        return `<ul>${items}</ul>`;
      }

      // Ordered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const item = line.replace(/^\d+\.\s+/, '');
            return `<li>${this.escapeHtml(item)}</li>`;
          })
          .join('\n');
        return `<ol>${items}</ol>`;
      }
      
      // Bold text **text**
      let processed = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic text *text*
      processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Code `code`
      processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');

      // Regular paragraph
      return `<p>${this.escapeHtml(processed)}</p>`;
    }).join('\n');
    
    console.log('Content formatted successfully');
    return formatted;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
