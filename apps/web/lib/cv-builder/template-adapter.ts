/**
 * Template Adapter
 *
 * Bridges existing TEMPLATE_COMPONENTS registry with TemplateProvider abstraction.
 * Allows gradual migration from direct component imports to dynamic template loading.
 */

import { TEMPLATE_COMPONENTS } from '@/components/templates/registry';
import { NakuruTemplate } from '@/components/templates/nakuru';
import type { ComponentType } from 'react';
import type { TemplateId } from '@/types';

/**
 * Get template component by ID
 * Falls back to NakuruTemplate if not found
 */
export function getTemplateComponent(templateId: string): ComponentType<any> {
  const Component = TEMPLATE_COMPONENTS[templateId as TemplateId];
  if (!Component) {
    console.warn(`Template component not found: ${templateId}, using Nakuru fallback`);
    return NakuruTemplate;
  }
  return Component;
}

/**
 * Check if a template component exists
 */
export function hasTemplateComponent(templateId: string): boolean {
  return templateId in TEMPLATE_COMPONENTS;
}

/**
 * Get all available template IDs from registry
 */
export function getAvailableTemplateIds(): TemplateId[] {
  return Object.keys(TEMPLATE_COMPONENTS) as TemplateId[];
}

/**
 * Render a template component with CV data
 * This is a wrapper for SSR compatibility
 */
export async function renderTemplateComponent(
  templateId: string,
  props: Record<string, any>
): Promise<string> {
  // For now, return a placeholder
  // Real implementation would use React.renderToString or similar
  return `<div>Template: ${templateId}</div>`;
}
