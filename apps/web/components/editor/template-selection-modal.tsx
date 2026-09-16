"use client";

import { useEffect, useState } from 'react';
import { templateProvider, type TemplateMetadata, type TemplateFamily } from '@/lib/templates';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  currentTemplateId?: string;
}

export function TemplateSelectionModal({
  isOpen,
  onClose,
  onSelectTemplate,
  currentTemplateId,
}: TemplateSelectionModalProps) {
  const [families, setFamilies] = useState<TemplateFamily[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<TemplateFamily | null>(null);
  const [familyTemplates, setFamilyTemplates] = useState<TemplateMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load families on mount
   */
  useEffect(() => {
    if (!isOpen) return;

    const loadFamilies = async () => {
      try {
        setLoading(true);
        const data = await templateProvider.getFamiliesForProduct('sumaiya', {
          category: 'cv',
          tier: 'core',
        });
        setFamilies(data);
        if (data.length > 0 && !selectedFamily) {
          setSelectedFamily(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load families');
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && families.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              <p className="font-medium">Error loading templates</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Family Tabs */}
              <div>
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                  {families.map((family) => (
                    <button
                      key={family.id}
                      onClick={() => setSelectedFamily(family)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedFamily?.id === family.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {family.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : familyTemplates.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-600">
                  <p>No templates available in this family</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {familyTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        currentTemplateId === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        onSelectTemplate(template.id);
                        onClose();
                      }}
                    >
                      {/* Preview */}
                      {template.preview && (
                        <div className="aspect-video bg-gray-100 overflow-hidden">
                          <img
                            src={template.preview}
                            alt={template.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div className="p-3">
                        <h4 className="font-medium text-sm text-gray-900">
                          {template.name}
                        </h4>
                        {template.tier === 'premium' && (
                          <p className="text-xs text-amber-600 mt-1">Premium</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
