import html2pdf from 'html2pdf.js';
import { EBook, Chapter, Template } from '../types';
import { HTMLRenderer } from './html-renderer';

export class PDFExporter {
  async exportEBook(
    ebook: EBook,
    chapters: Chapter[],
    template: Template,
    includeWatermark: boolean = false
  ): Promise<Blob> {
    const renderer = new HTMLRenderer();
    const htmlContent = renderer.generateHTML(ebook, chapters, template);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `${ebook.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0
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
      };

      const pdfBlob = await html2pdf()
        .set(opt)
        .from(tempDiv.querySelector('body')!)
        .outputPdf('blob');

      return pdfBlob;
    } finally {
      document.body.removeChild(tempDiv);
    }
  }
}
