"use client";

import { useState, useCallback, useEffect } from 'react';
import {
  loadCVTemplates,
  loadTemplateFamilies,
  getTemplateMetadata,
  renderCVPreview,
  exportCVToPDF,
  getRecommendedTemplate,
  getMatchingCoverLetterTemplate,
} from './template-integration';
import type { TemplateMetadata, TemplateFamily } from '@/lib/templates';

interface UseTemplateProviderReturn {
  templates: TemplateMetadata[];
  families: TemplateFamily[];
  isLoading: boolean;
  error: string | null;
  loadTemplates: (tier?: 'core' | 'premium') => Promise<void>;
  loadFamilies: () => Promise<void>;
  getTemplateMetadata: typeof getTemplateMetadata;
  renderCVPreview: typeof renderCVPreview;
  exportCVToPDF: typeof exportCVToPDF;
  getRecommendedTemplate: typeof getRecommendedTemplate;
  getMatchingCoverLetterTemplate: typeof getMatchingCoverLetterTemplate;
}

export function useTemplateProviderHook(): UseTemplateProviderReturn {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [families, setFamilies] = useState<TemplateFamily[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all CV templates for current tier
   */
  const loadTemplatesCallback = useCallback(
    async (tier: 'core' | 'premium' = 'core') => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await loadCVTemplates({ tier });
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Load template families
   */
  const loadFamiliesCallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadTemplateFamilies();
      setFamilies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load families');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initial load of families
   */
  useEffect(() => {
    loadFamiliesCallback();
  }, [loadFamiliesCallback]);

  return {
    templates,
    families,
    isLoading,
    error,
    loadTemplates: loadTemplatesCallback,
    loadFamilies: loadFamiliesCallback,
    getTemplateMetadata,
    renderCVPreview,
    exportCVToPDF,
    getRecommendedTemplate,
    getMatchingCoverLetterTemplate,
  };
}
