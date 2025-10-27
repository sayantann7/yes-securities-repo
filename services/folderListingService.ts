import { getToken } from './authService';
import { swr } from './cache';
import { API_URL } from '@/constants/api';

type FolderListingOptions = {
  includeUrls?: boolean;
  loadIcons?: boolean;
  maxItems?: number;
};

export interface FolderListingResponse {
  folders: Array<{
    key: string;
    iconUrl?: string | null;
    isBookmarked?: boolean;
    itemCount?: number;
    lastModified?: string;
  }>;
  files: Array<{
    key: string;
    url?: string | null;
    size?: number;
    lastModified?: string;
    thumbnailUrl?: string | null;
    iconUrl?: string | null;
    isBookmarked?: boolean;
  }>;
  isTruncated?: boolean;
  continuationToken?: string | null;
  totalItems?: number;
}

const buildCacheKey = (prefixKey: string, options: FolderListingOptions) => {
  const withUrls = options.includeUrls ? 'urls' : 'no-urls';
  const withIcons = options.loadIcons === false ? 'no-icons' : 'icons';
  const maxItems = options.maxItems ?? 'default';
  return `listing:${prefixKey}:${withUrls}:${withIcons}:${maxItems}`;
};

const normalizePrefix = (folderId: string | null): string => {
  if (!folderId) return '';
  const trimmed = folderId.trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

export async function loadFolderListing(
  folderId: string | null,
  options: FolderListingOptions = {}
): Promise<FolderListingResponse> {
  const prefix = normalizePrefix(folderId);
  const cacheKey = buildCacheKey(prefix || 'root', options);
  const ttl = options.includeUrls ? 55_000 : 120_000; // Signed URLs shorter TTL

  return await swr(cacheKey, ttl, async () => {
    const token = await getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const body = {
      prefix,
      loadIcons: options.loadIcons !== false,
      includeUrls: options.includeUrls === true,
    };

    if (typeof options.maxItems === 'number') {
      (body as any).maxItems = options.maxItems;
    }

    const response = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to load folder listing:', response.status, errorText);
      throw new Error('Failed to load folder listing');
    }

    const data = await response.json();
    return {
      folders: Array.isArray(data.folders) ? data.folders : [],
      files: Array.isArray(data.files) ? data.files : [],
      isTruncated: data.isTruncated ?? false,
      continuationToken: data.continuationToken ?? null,
      totalItems: data.totalItems ?? undefined,
    };
  });
}
