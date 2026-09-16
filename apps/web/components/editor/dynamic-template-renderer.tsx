"use client";

import { useEffect, useState } from 'react';
import { templateProvider } from '@/lib/templates';
import type { CVData } from '@/types';

interface DynamicTemplateRendererProps {
  templateId: string;
  cvData: CVData;
  lang?: 'en' | 'sw';
  onError?: (error: Error) => void;
}

export function DynamicTemplateRenderer({
  templateId,
  cvData,
  lang = 'en',
  onError,
}: DynamicTemplateRendererProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const renderTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        const rendered = await templateProvider.renderDocument(templateId, cvData as any, {
          lang,
        });

        setHtml(rendered.content);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to render template');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    renderTemplate();
  }, [templateId, cvData, lang, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p className="font-medium">Failed to render template</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-gray-600">
        <p>No template content</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        title="CV Preview"
        srcDoc={html}
        className="h-full w-full border-0"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
