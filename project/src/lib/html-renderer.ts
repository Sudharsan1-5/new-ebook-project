import { EBook, Chapter, Template } from '../types';

export class HTMLRenderer {
  generateHTML(
    ebook: EBook,
    chapters: Chapter[],
    template: Template
  ): string {
    const styles = this.generateStyles(template);
    const content = this.generateContent(ebook, chapters);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(ebook.title)}</title>
  <style>${styles}</style>
</head>
<body>
  ${content}
</body>
</html>
    `.trim();
  }

  private generateStyles(template: Template): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: ${template.styles.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: ${template.styles.fontSize.body}pt;
        line-height: ${template.styles.lineHeight.body};
        color: ${template.styles.colors.text};
        background: white;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
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
        text-indent: 0;
      }

      .chapter-content p:first-child::first-letter {
        font-size: 3em;
        font-weight: bold;
        float: left;
        line-height: 1;
        margin: 0 8px 0 0;
        color: ${template.styles.colors.heading};
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

      .chapter-content blockquote {
        margin: 24px 0;
        padding: 16px 24px;
        border-left: 4px solid ${template.styles.colors.heading};
        background: #f9f9f9;
        font-style: italic;
      }

      .chapter-content code {
        background: #f4f4f4;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }

      .chapter-content pre {
        background: #f4f4f4;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 16px 0;
      }

      .chapter-content pre code {
        background: none;
        padding: 0;
      }

      @media print {
        body {
          padding: 0;
        }

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
  <p class="cover-subtitle">${this.escapeHtml(ebook.audience)} • ${this.escapeHtml(ebook.tone)}</p>
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
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return paragraphs.map(paragraph => {
      const trimmed = paragraph.trim();

      if (trimmed.startsWith('## ')) {
        return `<h2>${this.escapeHtml(trimmed.substring(3))}</h2>`;
      }

      if (trimmed.startsWith('### ')) {
        return `<h3>${this.escapeHtml(trimmed.substring(4))}</h3>`;
      }

      if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.split('\n')
          .map(line => line.replace(/^> /, ''))
          .join('<br>');
        return `<blockquote>${this.escapeHtml(quoteText)}</blockquote>`;
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
