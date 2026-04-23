// lib/search.ts
import { getGuides, getParts, getSystems } from './selectors';

export interface SearchResult {
  type: 'system' | 'part' | 'guide';
  id: string;
  title: string;
  description: string;
  systemName?: string;
  partName?: string;
  url: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const q = normalizeText(query.trim());
  if (!q) return [];

  const [systems, parts, guides] = await Promise.all([
    getSystems(),
    getParts(),
    getGuides(),
  ]);

  const results: SearchResult[] = [];

  // Helper to check if normalized text includes query
  const matches = (text: string) => normalizeText(text).includes(q);

  // Search systems
  for (const system of systems) {
    if (matches(system.name) || matches(system.description)) {
      results.push({
        type: 'system',
        id: system.id,
        title: system.name,
        description: system.description,
        url: `/systems/${system.id}`,
      });
    }
  }

  // Search parts
  for (const part of parts) {
    if (
      matches(part.name) ||
      matches(part.description) ||
      matches(part.partNumber) ||
      matches(part.brand) ||
      part.symptoms.some(s => matches(s))
    ) {
      const system = systems.find(s => s.id === part.systemId);
      results.push({
        type: 'part',
        id: part.id,
        title: part.name,
        description: part.description,
        systemName: system?.name,
        url: `/parts/${part.id}`,
      });
    }
  }

  // Search guides
  for (const guide of guides) {
    if (
      matches(guide.title) ||
      matches(guide.description) ||
      guide.tools.some(t => matches(t)) ||
      guide.materials.some(m => matches(m))
    ) {
      const part = parts.find(p => p.id === guide.partId);
      const system = part ? systems.find(s => s.id === part.systemId) : null;
      results.push({
        type: 'guide',
        id: guide.id,
        title: guide.title,
        description: guide.description,
        systemName: system?.name,
        partName: part?.name,
        url: `/guides/${guide.id}`,
      });
    }
  }

  return results;
}
