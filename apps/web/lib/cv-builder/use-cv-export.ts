"use client";

import { useState, useCallback } from 'react';
import { templateProvider } from '@/lib/templates';
import { renderElementToPdfBlob, triggerBlobDownload } from '@/lib/pdf';
import type { CVData } from '@/types';

interface ExportOptions {
  filename?: string;
  format?: 'pdf' | 'html' | 'json';
}

export function useCVExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export CV as PDF
   */
  const exportAsPDF = useCallback(
    async (templateId: string, cvData: CVData, options?: ExportOptions) => {
      try {
        setIsExporting(true);
        setError(null);

        // Render template to HTML
        const rendered = await templateProvider.renderDocument(templateId, cvData as any);

        // Create DOM element from HTML
        const container = document.createElement('div');
        container.innerHTML = rendered.content;
        container.style.display = 'none';
        document.body.appendChild(container);

        // Convert to PDF
        const pdfBlob = await renderElementToPdfBlob(container, {
          filename: options?.filename || `CV-${Date.now()}.pdf`,
        });

        // Clean up
        document.body.removeChild(container);

        // Download
        const filename = options?.filename || `CV-${Date.now()}.pdf`;
        triggerBlobDownload(pdfBlob, filename);

        return pdfBlob;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to export PDF';
        setError(errorMsg);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  /**
   * Export CV as HTML
   */
  const exportAsHTML = useCallback(
    async (templateId: string, cvData: CVData, options?: ExportOptions) => {
      try {
        setIsExporting(true);
        setError(null);

        // Render template to HTML
        const rendered = await templateProvider.renderDocument(templateId, cvData as any);

        // Create blob and download
        const blob = new Blob([rendered.content], { type: 'text/html' });
        const filename = options?.filename || `CV-${Date.now()}.html`;
        triggerBlobDownload(blob, filename);

        return blob;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to export HTML';
        setError(errorMsg);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  /**
   * Export CV as JSON (raw data)
   */
  const exportAsJSON = useCallback(
    async (cvData: CVData, options?: ExportOptions) => {
      try {
        setIsExporting(true);
        setError(null);

        const blob = new Blob([JSON.stringify(cvData, null, 2)], {
          type: 'application/json',
        });
        const filename = options?.filename || `CV-${Date.now()}.json`;
        triggerBlobDownload(blob, filename);

        return blob;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to export JSON';
        setError(errorMsg);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  /**
   * Generic export method
   */
  const exportCV = useCallback(
    async (
      templateId: string,
      cvData: CVData,
      format: 'pdf' | 'html' | 'json' = 'pdf',
      options?: ExportOptions
    ) => {
      switch (format) {
        case 'pdf':
          return exportAsPDF(templateId, cvData, options);
        case 'html':
          return exportAsHTML(templateId, cvData, options);
        case 'json':
          return exportAsJSON(cvData, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    },
    [exportAsPDF, exportAsHTML, exportAsJSON]
  );

  return {
    exportCV,
    exportAsPDF,
    exportAsHTML,
    exportAsJSON,
    isExporting,
    error,
  };
}
