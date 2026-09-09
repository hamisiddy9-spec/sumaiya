import type { Template } from "@sumaiya/types";

// Mock CV templates for mobile and web
// In production, this would be dynamically generated from the template engine
export const TEMPLATES: Template[] = [
  {
    id: "template-1",
    name: "Modern Professional",
    category: "Professional",
    previewUrl: "https://example.com/template-1.png",
    colorScheme: "#2c3e50",
    isAtsOptimized: true,
    languages: ["en", "sw"]
  },
  {
    id: "template-2",
    name: "Creative Designer",
    category: "Creative",
    previewUrl: "https://example.com/template-2.png",
    colorScheme: "#e74c3c",
    isAtsOptimized: false,
    languages: ["en"]
  },
  {
    id: "template-3",
    name: "Tech Minimal",
    category: "Technology",
    previewUrl: "https://example.com/template-3.png",
    colorScheme: "#34495e",
    isAtsOptimized: true,
    languages: ["en", "sw"]
  },
  {
    id: "template-4",
    name: "Executive",
    category: "Executive",
    previewUrl: "https://example.com/template-4.png",
    colorScheme: "#1a1a1a",
    isAtsOptimized: true,
    languages: ["en"]
  },
  {
    id: "template-5",
    name: "Graduate Fresh",
    category: "Entry Level",
    previewUrl: "https://example.com/template-5.png",
    colorScheme: "#3498db",
    isAtsOptimized: true,
    languages: ["en", "sw"]
  }
];

export function getTemplateById(templateId: string): Template | undefined {
  return TEMPLATES.find(t => t.id === templateId);
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter(t => t.category === category);
}

export function getAtsOptimizedTemplates(): Template[] {
  return TEMPLATES.filter(t => t.isAtsOptimized);
}
