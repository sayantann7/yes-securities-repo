import { API_BASE_URL } from '@/constants/api';
import { searchDocuments } from '@/services/documentService';

const API_URL = `${API_BASE_URL}/api`;

export type SearchType = 'all' | 'files' | 'folders';

export interface SearchFilters {
  fileTypes?: string[];
  dateRange?: { start?: string; end?: string };
}

export interface SearchItem {
  key: string; // S3 key or folder prefix
  type: 'file' | 'folder';
  lastModified?: string;
}

export async function searchAll(q: string, type: SearchType = 'all', filters: SearchFilters = {}, limit = 100): Promise<SearchItem[]> {
  const body: any = { q, type, limit };
  if (filters.fileTypes) body.fileTypes = filters.fileTypes;
  if (filters.dateRange) body.dateRange = filters.dateRange;
  try {
    const res = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      // If backend doesn't have /search, fall back to client-side search
      if (res.status === 404) {
        return await fallbackSearchAll(q, type, filters, limit);
      }
      throw new Error(`Search failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (err) {
    // Network or other errors: fallback
    return await fallbackSearchAll(q, type, filters, limit);
  }
}

async function listFoldersFast(prefix: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/folders/fast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, maxItems: 1000 }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const arr = Array.isArray(data.folders) ? data.folders : [];
  // Each entry is like { key: 'path/' }
  return arr.map((f: any) => f.key).filter((k: any) => typeof k === 'string');
}

async function fallbackSearchAll(q: string, type: SearchType, filters: SearchFilters, limit: number): Promise<SearchItem[]> {
  const needle = q.toLowerCase();
  const out: SearchItem[] = [];

  // Files via existing client search (documents only)
  if (type === 'all' || type === 'files') {
    const docs = await searchDocuments(q, {
      fileTypes: filters.fileTypes,
      dateRange: filters.dateRange ? { start: filters.dateRange.start ? new Date(filters.dateRange.start) : null, end: filters.dateRange.end ? new Date(filters.dateRange.end) : null } : undefined,
      authors: [],
    } as any);
    for (const d of docs) {
      out.push({ key: d.id, type: 'file', lastModified: d.createdAt });
      if (out.length >= limit) return out.slice(0, limit);
    }
  }

  // Folders via fast BFS using /folders/fast (names derived from key last segment)
  if ((type === 'all' || type === 'folders') && out.length < limit) {
    const queue: string[] = [''];
    const visited = new Set<string>();
    let scanned = 0;
    const SCAN_CAP = 2000;
    while (queue.length && scanned < SCAN_CAP && out.length < limit) {
      const pfx = queue.shift()!;
      if (visited.has(pfx)) continue;
      visited.add(pfx);
      const subs = await listFoldersFast(pfx);
      scanned += subs.length;
      for (const key of subs) {
        const name = key.replace(/^\/+/, '').replace(/\/+$/, '').split('/').pop() || key;
        if (name.toLowerCase().includes(needle)) {
          out.push({ key, type: 'folder' });
          if (out.length >= limit) break;
        }
        // enqueue subfolder
        queue.push(key);
      }
    }
  }
  return out.slice(0, limit);
}
