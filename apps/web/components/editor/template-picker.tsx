"use client";

import { useEffect, useState } from 'react';
import { templateProvider, type TemplateMetadata, type TemplateFamily } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TemplatePickerProps {
  onSelectTemplate: (templateId: string) => void;
  isLoading?: boolean;
}

export function TemplatePicker({ onSelectTemplate, isLoading = false }: TemplatePickerProps) {
  const [families, setFamilies] = useState<TemplateFamily[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<TemplateFamily | null>(null);
  const [familyTemplates, setFamilyTemplates] = useState<TemplateMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load available template families on mount
   */
  useEffect(() => {
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const data = await templateProvider.getFamiliesForProduct('sumaiya', {
          category: 'cv',
          tier: 'core',
        });
        setFamilies(data);
        if (data.length > 0) {
          setSelectedFamily(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template families');
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, []);

  /**
   * Load templates when family changes
   */
  useEffect(() => {
    if (!selectedFamily) return;

    const loadTemplates = async () => {
      try {
        setLoading(true);
        const data = await templateProvider.getTemplatesByCategory('cv', {
          family: selectedFamily.id,
          tier: 'core',
        });
        setFamilyTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [selectedFamily]);

  if (loading && families.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>Error loading templates: {error}</p>
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-gray-600">
        <p>No template families available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Selector */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Choose a Template Family</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {families.map((family) => (
            <button
              key={family.id}
              onClick={() => setSelectedFamily(family)}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                selectedFamily?.id === family.id
                  ? 'border-ember bg-ember/10'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{family.name}</div>
              {family.description && (
                <div className="mt-1 text-xs text-gray-500">{family.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Templates in Selected Family */}
      {selectedFamily && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Choose a Template from {selectedFamily.name}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : familyTemplates.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-gray-600 swap-in">
              <p>No templates available in this family</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 swap-in">
              {familyTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Template Preview */}
                  {template.preview && (
                    <div className="mb-3 aspect-video overflow-hidden rounded bg-gray-100">
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Template Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    {template.description && (
                      <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                    )}
                    {template.tier && (
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          template.tier === 'premium'
                            ? 'bg-warning/15 text-warning/90'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {template.tier === 'premium' ? 'Premium' : 'Core'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Select Button */}
                  <Button
                    onClick={() => onSelectTemplate(template.id)}
                    disabled={isLoading}
                    className="mt-4 w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
