import JSZip from 'jszip';
import { EBook, Chapter, Template } from '../types';

export class EPUBExporter {
  private zip: JSZip;

  constructor() {
    this.zip = new JSZip();
  }

  async exportEBook(
    ebook: EBook,
    chapters: Chapter[],
    template: Template
  ): Promise<Blob> {
    this.zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    this.addMetaInf();
    this.addContainer();
    this.addContent(ebook, chapters, template);
    this.addTOC(ebook, chapters);
    this.addOPF(ebook, chapters);
    this.addStyles(template);

    return await this.zip.generateAsync({ type: 'blob' });
  }

  private addMetaInf() {
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

    this.zip.folder('META-INF')?.file('container.xml', containerXml);
  }

  private addContainer() {
    this.zip.folder('OEBPS');
    this.zip.folder('OEBPS/text');
  }

  private addContent(ebook: EBook, chapters: Chapter[], template: Template) {
    const coverHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this.escapeXml(ebook.title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles.css"/>
</head>
<body>
  <div class="cover">
    <h1>${this.escapeXml(ebook.title)}</h1>
    <p class="subtitle">${this.escapeXml(ebook.audience)} • ${this.escapeXml(ebook.tone)}</p>
  </div>
</body>
</html>`;

    this.zip.folder('OEBPS/text')?.file('cover.xhtml', coverHtml);

    chapters.forEach((chapter) => {
      const chapterHtml = this.createChapterHTML(chapter, ebook.title);
      this.zip.folder('OEBPS/text')?.file(`chapter${chapter.chapter_number}.xhtml`, chapterHtml);
    });
  }

  private createChapterHTML(chapter: Chapter, bookTitle: string): string {
    const paragraphs = chapter.content
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `    <p>${this.escapeXml(p.trim())}</p>`)
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chapter ${chapter.chapter_number}: ${this.escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles.css"/>
</head>
<body>
  <div class="chapter">
    <h2 class="chapter-number">Chapter ${chapter.chapter_number}</h2>
    <h1 class="chapter-title">${this.escapeXml(chapter.title)}</h1>
    <div class="chapter-content">
${paragraphs}
    </div>
  </div>
</body>
</html>`;
  }

  private addTOC(ebook: EBook, chapters: Chapter[]) {
    const navItems = chapters
      .map((ch) =>
        `      <li><a href="text/chapter${ch.chapter_number}.xhtml">Chapter ${ch.chapter_number}: ${this.escapeXml(ch.title)}</a></li>`
      )
      .join('\n');

    const tocXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="text/cover.xhtml">Cover</a></li>
${navItems}
    </ol>
  </nav>
</body>
</html>`;

    this.zip.folder('OEBPS')?.file('toc.xhtml', tocXhtml);
  }

  private addOPF(ebook: EBook, chapters: Chapter[]) {
    const manifestItems = chapters
      .map((ch) =>
        `    <item id="chapter${ch.chapter_number}" href="text/chapter${ch.chapter_number}.xhtml" media-type="application/xhtml+xml"/>`
      )
      .join('\n');

    const spineItems = chapters
      .map((ch) => `    <itemref idref="chapter${ch.chapter_number}"/>`)
      .join('\n');

    const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${this.escapeXml(ebook.title)}</dc:title>
    <dc:identifier id="bookid">urn:uuid:${ebook.id}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:creator>Created with eBook Generator</dc:creator>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="styles" href="styles.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine>
    <itemref idref="cover"/>
${spineItems}
  </spine>
</package>`;

    this.zip.folder('OEBPS')?.file('content.opf', opfContent);
  }

  private addStyles(template: Template) {
    const css = `
body {
  font-family: ${template.styles.fontFamily}, serif;
  font-size: ${template.styles.fontSize.body}pt;
  line-height: ${template.styles.lineHeight.body};
  color: ${template.styles.colors.text};
  margin: ${template.styles.margins.top}px ${template.styles.margins.right}px ${template.styles.margins.bottom}px ${template.styles.margins.left}px;
  text-align: justify;
}

.cover {
  text-align: center;
  padding: 20% 10%;
}

.cover h1 {
  font-size: ${template.styles.fontSize.title}pt;
  line-height: ${template.styles.lineHeight.title};
  margin-bottom: 1em;
  color: ${template.styles.colors.heading};
}

.cover .subtitle {
  font-size: ${template.styles.fontSize.heading}pt;
  font-style: italic;
  color: ${template.styles.colors.accent};
}

.chapter {
  page-break-before: always;
}

.chapter-number {
  font-size: ${template.styles.fontSize.heading}pt;
  color: ${template.styles.colors.accent};
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 0.5em;
}

.chapter-title {
  font-size: ${template.styles.fontSize.heading}pt;
  line-height: ${template.styles.lineHeight.heading};
  color: ${template.styles.colors.heading};
  margin-bottom: 1.5em;
}

.chapter-content p {
  margin-bottom: 1em;
  text-indent: 1.5em;
}

.chapter-content p:first-of-type {
  text-indent: 0;
}

h1, h2, h3, h4, h5, h6 {
  page-break-after: avoid;
}

p {
  orphans: 2;
  widows: 2;
}
`;

    this.zip.folder('OEBPS')?.file('styles.css', css);
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
