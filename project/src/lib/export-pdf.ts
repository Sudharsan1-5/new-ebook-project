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
    // Validate chapters have content
    if (!chapters || chapters.length === 0) {
      throw new Error('No chapters to export');
    }

    const hasContent = chapters.some(ch => ch.content && ch.content.trim().length > 0);
    if (!hasContent) {
      throw new Error('Chapters have no content');
    }

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

    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;

    // Set the content
    container.innerHTML = content;
    container.insertBefore(styleElement, container.firstChild);

    document.body.appendChild(container);

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
      await document.fonts.ready;

      // Wait for images to load if cover is included
      if (includeCover && coverImageUrl) {
        const images = container.getElementsByTagName('img');
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => {
                // Image failed to load, continue anyway
                resolve();
              };
              setTimeout(() => resolve(), 5000); // Timeout after 5s
            });
          })
        );
      }

      // Delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF and return as blob
      const pdfBlob = await html2pdf()
        .set(opt)
        .from(container)
        .output('blob');

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
        font-family: ${template.styles.fontFamily}, 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
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
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      }

      .cover-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        page-break-after: always;
        padding: 80px 60px;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        position: relative;
      }

      .cover-page::before {
        content: '';
        position: absolute;
        top: 40px;
        left: 40px;
        right: 40px;
        bottom: 40px;
        border: 2px solid ${template.styles.colors.heading};
        opacity: 0.2;
      }

      .cover-title {
        font-size: 52pt;
        font-weight: 700;
        color: ${template.styles.colors.heading};
        margin-bottom: 40px;
        line-height: 1.15;
        letter-spacing: -0.5px;
        text-transform: uppercase;
        position: relative;
        z-index: 1;
      }

      .cover-subtitle {
        font-size: 16pt;
        color: ${template.styles.colors.text};
        opacity: 0.75;
        font-weight: 400;
        letter-spacing: 2px;
        text-transform: uppercase;
        position: relative;
        z-index: 1;
      }

      .toc-page {
        page-break-after: always;
        padding: 60px 0;
        background: white;
      }

      .toc-title {
        font-size: 38pt;
        font-weight: 700;
        color: ${template.styles.colors.heading};
        margin-bottom: 50px;
        text-align: center;
        letter-spacing: 1px;
        text-transform: uppercase;
        border-bottom: 3px solid ${template.styles.colors.heading};
        padding-bottom: 20px;
      }

      .toc-item {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 18px;
        font-size: 13pt;
        line-height: 1.6;
        padding: 8px 0;
        transition: all 0.3s ease;
      }

      .toc-item:hover {
        background: rgba(0,0,0,0.02);
        padding-left: 8px;
      }

      .toc-chapter {
        flex: 1;
        padding-right: 12px;
        font-weight: 500;
      }

      .toc-dots {
        flex-grow: 1;
        border-bottom: 2px dotted #d0d0d0;
        height: 0.8em;
        margin: 0 12px;
      }

      .toc-page-num {
        font-weight: 600;
        color: ${template.styles.colors.heading};
        min-width: 30px;
        text-align: right;
      }

      .chapter {
        page-break-before: always;
        padding: 50px 0;
        min-height: 80vh;
      }

      .chapter:first-of-type {
        page-break-before: auto;
      }

      .chapter-title {
        font-size: ${template.styles.fontSize.heading}pt;
        font-weight: 700;
        color: ${template.styles.colors.heading};
        margin-bottom: 40px;
        line-height: ${template.styles.lineHeight.heading};
        border-left: 5px solid ${template.styles.colors.heading};
        padding-left: 20px;
        padding-bottom: 12px;
        letter-spacing: -0.3px;
      }

      .chapter-content {
        font-size: ${template.styles.fontSize.body}pt;
        line-height: ${template.styles.lineHeight.body};
        color: ${template.styles.colors.text};
      }

      .chapter-content p {
        margin-bottom: 24px;
        text-align: justify;
        hyphens: auto;
        word-spacing: 0.05em;
      }

      .chapter-content p:first-of-type::first-letter {
        font-size: 3.5em;
        font-weight: bold;
        float: left;
        line-height: 0.85;
        margin: 0.05em 0.1em 0 0;
        color: ${template.styles.colors.heading};
      }

      .chapter-content h2 {
        font-size: 22pt;
        font-weight: 700;
        color: ${template.styles.colors.heading};
        margin: 40px 0 20px 0;
        padding-top: 10px;
        border-top: 2px solid rgba(0,0,0,0.1);
        letter-spacing: -0.2px;
      }

      .chapter-content h3 {
        font-size: 17pt;
        font-weight: 600;
        color: ${template.styles.colors.heading};
        margin: 32px 0 16px 0;
        font-style: italic;
      }

      .chapter-content strong {
        font-weight: 700;
        color: #1a1a1a;
      }

      .chapter-content em {
        font-style: italic;
        color: #2a2a2a;
      }

      .chapter-content code {
        font-family: 'Courier New', Courier, monospace;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.9em;
        color: #c7254e;
        border: 1px solid #e0e0e0;
      }

      .chapter-content ul,
      .chapter-content ol {
        margin: 24px 0 24px 40px;
        line-height: 1.9;
      }

      .chapter-content li {
        margin-bottom: 12px;
        padding-left: 8px;
      }

      .chapter-content ul li {
        list-style-type: disc;
      }

      .chapter-content ol li {
        list-style-type: decimal;
      }

      .chapter-content li strong {
        color: ${template.styles.colors.heading};
      }

      .chapter-content blockquote {
        margin: 30px 20px;
        padding: 20px 25px;
        border-left: 4px solid ${template.styles.colors.heading};
        background: #f9f9f9;
        font-style: italic;
        color: #555;
        position: relative;
      }

      .chapter-content blockquote::before {
        content: '"';
        font-size: 48pt;
        color: ${template.styles.colors.heading};
        opacity: 0.3;
        position: absolute;
        top: -10px;
        left: 10px;
      }

      @media print {
        .cover-page,
        .toc-page,
        .chapter {
          page-break-after: always;
        }

        .chapter-content h2,
        .chapter-content h3 {
          page-break-after: avoid;
        }

        .chapter-content ul,
        .chapter-content ol,
        .chapter-content blockquote {
          page-break-inside: avoid;
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
      return '<p class="no-content">No content available.</p>';
    }

    // Split by double newlines for paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    const formatted = paragraphs.map((paragraph) => {
      const trimmed = paragraph.trim();

      // Headers - escape HTML first, then wrap
      if (trimmed.startsWith('## ')) {
        return `<h2>${this.escapeHtml(trimmed.substring(3))}</h2>`;
      }

      if (trimmed.startsWith('### ')) {
        return `<h3>${this.escapeHtml(trimmed.substring(4))}</h3>`;
      }

      if (trimmed.startsWith('# ')) {
        return `<h2>${this.escapeHtml(trimmed.substring(2))}</h2>`;
      }

      // Unordered lists - process inline formatting
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const item = line.replace(/^[*\-]\s+/, '');
            const formattedItem = this.formatInlineMarkdown(item);
            return `<li>${formattedItem}</li>`;
          })
          .join('\n');
        return `<ul>${items}</ul>`;
      }

      // Ordered lists - process inline formatting
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const item = line.replace(/^\d+\.\s+/, '');
            const formattedItem = this.formatInlineMarkdown(item);
            return `<li>${formattedItem}</li>`;
          })
          .join('\n');
        return `<ol>${items}</ol>`;
      }

      // Regular paragraph - process inline markdown formatting
      const formattedText = this.formatInlineMarkdown(trimmed);
      return `<p>${formattedText}</p>`;
    }).join('\n');

    return formatted;
  }

  /**
   * Format inline markdown (bold, italic, code) within text
   * Escapes HTML first, then applies markdown formatting
   */
  private formatInlineMarkdown(text: string): string {
    // Escape HTML entities first
    let escaped = this.escapeHtml(text);

    // Now apply markdown formatting (safe because HTML is escaped)
    // Bold text **text** - use non-greedy match and handle multiple occurrences
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic text *text* - but not if it's part of **
    escaped = escaped.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Code `code`
    escaped = escaped.replace(/`(.+?)`/g, '<code>$1</code>');

    return escaped;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}