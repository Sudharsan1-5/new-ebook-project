import html2pdf from 'html2pdf.js';
import { EBook, Chapter, Template } from '../types';

export class PDFExporter {
  async exportEBook(
    ebook: EBook,
    chapters: Chapter[],
    template: Template,
    includeWatermark: boolean = false
  ): Promise<Blob> {
    // Create a container div for the content
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.height = 'auto';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.zIndex = '-1000';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    
    // Generate the content directly without full HTML wrapper
    const styles = this.generateInlineStyles(template);
    const content = this.generateContent(ebook, chapters);
    
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
      
      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));

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

      body, .pdf-container {
        font-family: ${template.styles.fontFamily}, Georgia, serif;
        font-size: ${template.styles.fontSize.body}pt;
        line-height: ${template.styles.lineHeight.body};
        color: ${template.styles.colors.text};
        background: white;
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

  private generateContent(ebook: EBook, chapters: Chapter[]): string {
    const coverPage = this.generateCoverPage(ebook);
    const tocPage = this.generateTableOfContents(chapters);
    const chapterPages = chapters.map(chapter => this.generateChapter(chapter)).join('\n');

    return `${coverPage}\n${tocPage}\n${chapterPages}`;
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
      return '<p>No content available.</p>';
    }

    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return paragraphs.map(paragraph => {
      const trimmed = paragraph.trim();

      if (trimmed.startsWith('## ')) {
        return `<h2>${this.escapeHtml(trimmed.substring(3))}</h2>`;
      }

      if (trimmed.startsWith('### ')) {
        return `<h3>${this.escapeHtml(trimmed.substring(4))}</h3>`;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n')
          .map(line => {
            const item = line.replace(/^[*\-]\s+/, '');
            return `<li>${this.escapeHtml(item)}</li>`;
          })
          .join('\n');
        return `<ul>${items}</ul>`;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n')
          .map(line => {
            const item = line.replace(/^\d+\.\s+/, '');
            return `<li>${this.escapeHtml(item)}</li>`;
          })
          .join('\n');
        return `<ol>${items}</ol>`;
      }

      return `<p>${this.escapeHtml(trimmed)}</p>`;
    }).join('\n');
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
