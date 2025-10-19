import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FileText, BookOpen, Image, Download } from 'lucide-react';
import { PDFExporter } from '../lib/export-pdf';
import { EPUBExporter } from '../lib/export-epub';
import { templates, getTemplateById } from '../lib/templates';
import { EBook, Chapter } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ebook: EBook;
  chapters: Chapter[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  ebook,
  chapters
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'epub' | null>(null);

  const handleExportPDF = async () => {
    setExporting(true);
    setExportFormat('pdf');

    try {
      const template = getTemplateById('minimal-professional') || templates[0];
      const exporter = new PDFExporter();
      const blob = await exporter.exportEBook(ebook, chapters, template, false);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ebook.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setExporting(false);
        setExportFormat(null);
      }, 1000);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
      setExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportEPUB = async () => {
    setExporting(true);
    setExportFormat('epub');

    try {
      const template = getTemplateById('minimal-professional') || templates[0];
      const exporter = new EPUBExporter();
      const blob = await exporter.exportEBook(ebook, chapters, template);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ebook.title.replace(/[^a-z0-9]/gi, '_')}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setExporting(false);
        setExportFormat(null);
      }, 1000);
    } catch (error) {
      console.error('EPUB export failed:', error);
      alert('Failed to export EPUB. Please try again.');
      setExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportMockup = async () => {
    if (!ebook.cover_url) {
      alert('Mockup generation requires a cover image. Please generate a cover first.');
      return;
    }

    setExporting(true);
    setExportFormat('epub'); // Reuse the state

    try {
      // Create a canvas for the 3D mockup
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Set canvas size for high-quality mockup
      canvas.width = 2400;
      canvas.height = 1600;

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 20;
      ctx.shadowOffsetY = 20;

      // Draw book mockup (3D perspective)
      const bookWidth = 600;
      const bookHeight = 900;
      const bookX = (canvas.width - bookWidth) / 2;
      const bookY = (canvas.height - bookHeight) / 2;

      // Book spine (left side)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(bookX - 40, bookY);
      ctx.lineTo(bookX, bookY + 20);
      ctx.lineTo(bookX, bookY + bookHeight - 20);
      ctx.lineTo(bookX - 40, bookY + bookHeight);
      ctx.closePath();
      ctx.fill();

      // Book cover (front)
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bookX, bookY, bookWidth, bookHeight);

      // Load and draw cover image if available
      if (ebook.cover_url) {
        try {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = ebook.cover_url!;
          });

          // Draw the cover image
          ctx.shadowBlur = 0;
          ctx.drawImage(img, bookX + 20, bookY + 20, bookWidth - 40, bookHeight - 40);
        } catch (err) {
          console.error('Failed to load cover image:', err);
          // Draw placeholder if image fails
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(bookX + 20, bookY + 20, bookWidth - 40, bookHeight - 40);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ebook.title, bookX + bookWidth / 2, bookY + bookHeight / 2);
        }
      }

      // Add book title overlay at bottom
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ebook.title, canvas.width / 2, canvas.height - 80);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to generate mockup');
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ebook.title.replace(/[^a-z0-9]/gi, '_')}_mockup.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setTimeout(() => {
          setExporting(false);
          setExportFormat(null);
        }, 1000);
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('Mockup generation failed:', error);
      alert('Failed to generate mockup. Please try again.');
      setExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export eBook" size="md">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{ebook.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{chapters.length} chapters</span>
            <span>•</span>
            <span>{ebook.word_count.toLocaleString()} words</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Export as PDF</h4>
                <p className="text-sm text-gray-600">
                  Perfect for Gumroad, Etsy, and Whop. Includes clickable table of contents.
                </p>
                {exporting && exportFormat === 'pdf' && (
                  <p className="text-sm text-blue-600 mt-2">Generating PDF...</p>
                )}
              </div>
              <Download className="w-5 h-5 text-gray-400 ml-2" />
            </div>
          </button>

          <button
            onClick={handleExportEPUB}
            disabled={exporting}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Export as EPUB</h4>
                <p className="text-sm text-gray-600">
                  Optimized for Amazon KDP and e-readers. Reflowable text with multiple reading modes.
                </p>
                {exporting && exportFormat === 'epub' && (
                  <p className="text-sm text-blue-600 mt-2">Generating EPUB...</p>
                )}
              </div>
              <Download className="w-5 h-5 text-gray-400 ml-2" />
            </div>
          </button>

          <button
            onClick={handleExportMockup}
            disabled={exporting || !ebook.cover_url}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Image className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Export 3D Mockup</h4>
                <p className="text-sm text-gray-600">
                  High-resolution mockup image for product listings and marketing.
                </p>
                {!ebook.cover_url && (
                  <p className="text-sm text-gray-500 mt-2">Requires a cover image</p>
                )}
              </div>
              <Download className="w-5 h-5 text-gray-400 ml-2" />
            </div>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Pro Tip:</strong> Test your files before uploading to marketplaces.
            PDF files work best for direct download platforms, while EPUB is required for Amazon KDP.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
