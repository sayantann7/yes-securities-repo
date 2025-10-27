import { Folder, Document } from '@/types';
import { getToken } from './authService';
import { API_URL } from '@/constants/api';
import { loadFolderListing } from './folderListingService';

const detectFileType = (key: string): string => {
  const extension = key.split('.').pop()?.toLowerCase() || '';
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return 'image';
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'video';
    case 'mp3':
    case 'wav':
      return 'audio';
    case 'xlsx':
    case 'xls':
      return 'spreadsheet';
    case 'docx':
    case 'doc':
      return 'document';
    case 'pptx':
    case 'ppt':
      return 'presentation';
    default:
      return 'file';
  }
};

const readableSize = (sizeInBytes: number): string => {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) {
    return 'Unknown';
  }
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }
  if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const getFolders = async (parentId: string | null = null): Promise<Folder[]> => {
  try {
    const listing = await loadFolderListing(parentId, {
      includeUrls: false,
      loadIcons: true,
    });

    const folders: Folder[] = (listing.folders || [])
      .filter((folderObj) => typeof folderObj.key === 'string' && folderObj.key.length > 0)
      .map((folderObj) => {
        const folderPrefix = folderObj.key;
        const name = formatPrefix(folderPrefix);
        const itemCount = typeof folderObj.itemCount === 'number'
          ? folderObj.itemCount
          : undefined;

        return {
          id: folderPrefix,
          name,
          parentId,
          createdAt: folderObj.lastModified || new Date().toISOString(),
          itemCount,
          iconUrl: folderObj.iconUrl ?? undefined,
          isBookmarked: folderObj.isBookmarked || false,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getFolderData = async (folderId: string | null = null): Promise<Folder> => {
  try {
    const prefix = folderId && folderId.trim() !== '' ? folderId : '';
    const listing = await loadFolderListing(prefix || null, {
      includeUrls: false,
      loadIcons: true,
    });

    const name = formatPrefix(prefix);
    const documentsCount = Array.isArray(listing.files) ? listing.files.length : 0;
    const subfolderCount = Array.isArray(listing.folders) ? listing.folders.length : 0;

    return {
      id: prefix,
      name,
      parentId: null,
      createdAt: new Date().toISOString(),
      itemCount: documentsCount + subfolderCount,
    };
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

// Fetch both subfolders and documents using existing services
export const getFolderContents = async (
  folderId: string | null = null
): Promise<{ folders: Folder[]; files: Document[] }> => {
  const listing = await loadFolderListing(folderId, {
    includeUrls: true,
    loadIcons: true,
  });

  const folders = (listing.folders || []).map((folderObj) => ({
    id: folderObj.key,
    name: formatPrefix(folderObj.key),
    parentId: folderId,
    createdAt: folderObj.lastModified || new Date().toISOString(),
    itemCount: folderObj.itemCount,
    iconUrl: folderObj.iconUrl ?? undefined,
    isBookmarked: folderObj.isBookmarked || false,
  })).sort((a, b) => a.name.localeCompare(b.name));

  const files: Document[] = (listing.files || [])
    .filter((fileObj) => typeof fileObj.key === 'string' && !fileObj.key.endsWith('/'))
    .map((fileObj) => {
      const key = fileObj.key;
      const fileName = key.split('/').pop() || key;
      return {
        id: key,
        name: fileName,
  type: detectFileType(fileName),
  size: typeof fileObj.size === 'number' ? readableSize(fileObj.size) : 'Unknown',
        url: fileObj.url || '',
        thumbnailUrl: fileObj.thumbnailUrl ?? undefined,
        createdAt: fileObj.lastModified || new Date().toISOString(),
        author: 'Unknown',
        folderId: folderId,
        commentCount: 0,
        iconUrl: fileObj.iconUrl ?? undefined,
        isBookmarked: fileObj.isBookmarked || false,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { folders, files };
};

// Provide a way to fetch a single folder by ID for breadcrumb building
export const getFolderById = getFolderData;

/**
 * Create a new folder in the storage.
 * parentId: current folder prefix or null for root
 * name: new folder name
 * iconUri: optional custom icon URI
 */
export const createFolder = async (parentId: string | null, name: string, iconUri?: string): Promise<void> => {
  try {
    console.log('🔄 Creating folder:', { parentId, name, hasIcon: !!iconUri });

    // --- Input Validation ---
    const originalName = name;
    if (typeof name !== 'string') {
      throw new Error('Folder name must be a string');
    }
    name = name.trim();
    if (!name) {
      throw new Error('Folder name cannot be empty');
    }
    if (name.length > 80) {
      throw new Error('Folder name too long (max 80 characters)');
    }
    // Disallow path separators and control chars
    if (/[/\\]/.test(name)) {
      throw new Error('Folder name cannot contain slashes');
    }
    // Allow letters, numbers, spaces, dash, underscore, parentheses, ampersand, dot
    if (!/^[A-Za-z0-9 _()&.-]+$/.test(name)) {
      throw new Error('Folder name has invalid characters');
    }
    // Prevent reserved or risky names
    const reserved = new Set(['con','nul','prn','aux','com1','com2','lpt1','lpt2','.','..']);
    if (reserved.has(name.toLowerCase())) {
      throw new Error('Folder name is reserved');
    }
    // Collapse inner multiple spaces
    name = name.replace(/\s{2,}/g,' ');
    console.log('🛡️ Validated folder name:', { input: originalName, sanitized: name });
    
    // Determine prefix path
    let prefix = '';
    if (parentId && typeof parentId === 'string' && parentId.trim() !== '') {
      prefix = parentId.endsWith('/') ? parentId : `${parentId}/`;
    }
    console.log('📁 Using prefix:', prefix);
    
    // First create the folder
    const response = await fetch(`${API_URL}/folders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, name }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ createFolder response error:', response.status, errorBody);
      throw new Error(`Failed to create folder: ${response.status} ${errorBody}`);
    }
    
    console.log('✅ Folder created successfully');

    // If custom icon is provided, upload it
    if (iconUri) {
      try {
        const folderKey = `${prefix}${name}/`;
        console.log('🖼️ Uploading icon for folder path:', folderKey);
        const iconUrl = await uploadCustomIcon(folderKey, iconUri);
        console.log('✅ Folder icon uploaded successfully:', iconUrl);
      } catch (iconError) {
        console.error('❌ Icon upload failed but folder was created:', iconError);
        // Don't throw here - let the folder creation succeed even if icon fails
        // This matches the behavior described by the user
      }
    }
  } catch (error) {
    console.error('💥 Error creating folder:', error);
    throw error;
  }
};

/**
 * Upload a custom icon for a folder or file
 */
export const uploadCustomIcon = async (itemPath: string, iconUri: string): Promise<string> => {
  try {
    console.log('🔄 Starting icon upload process for:', { itemPath, iconUri });
    
    // Get authentication token
    const token = await getToken();
    console.log('🔑 Auth token available:', !!token);
    
    // Get the file extension from the URI
    const extension = iconUri.split('.').pop()?.toLowerCase() || 'png';
    console.log('📄 Detected file extension:', extension);
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Get signed upload URL
    console.log('📡 Requesting signed upload URL from:', `${API_URL}/icons/upload`);
    const response = await fetch(`${API_URL}/icons/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemPath, iconType: extension }),
    });
    
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Icon already exists');
      }
      const errorText = await response.text();
      console.error('❌ Failed to get upload URL:', response.status, errorText);
      throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
    }
    
  const { uploadUrl } = await response.json();
    console.log('✅ Received upload URL:', uploadUrl);
    
    // Upload the icon
    console.log('📤 Uploading icon to S3...');
    const iconBlob = await fetch(iconUri).then(r => r.blob());
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': `image/${extension}` },
      body: iconBlob,
    });
    
    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error('❌ S3 upload failed:', uploadResponse.status, uploadError);
      throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadError}`);
    }
    
    console.log('✅ Icon uploaded to S3 successfully');
    
    // Wait a moment for S3 to process the upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // After successful upload, refresh icon cache server-side to bypass any cached null
    console.log('� Requesting icon cache refresh...');
    const refreshHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) refreshHeaders['Authorization'] = `Bearer ${token}`;
    const refreshResp = await fetch(`${API_URL}/icons/refresh`, {
      method: 'POST',
      headers: refreshHeaders,
      body: JSON.stringify({ itemPath })
    });
    if (!refreshResp.ok) {
      const refreshErr = await refreshResp.text();
      console.error('❌ Icon refresh failed:', refreshResp.status, refreshErr);
      throw new Error(`Failed to refresh icon cache: ${refreshResp.status} ${refreshErr}`);
    }
    const refreshData = await refreshResp.json();
    if (!refreshData.iconUrl) {
      console.error('❌ Icon still not available after refresh attempts:', refreshData.attempts);
      throw new Error('Icon not yet available');
    }
    console.log('✅ Icon available after refresh:', refreshData.iconUrl);
    return refreshData.iconUrl;
  } catch (error) {
    console.error('💥 Error uploading custom icon:', error);
    throw error;
  }
};

/**
 * Rename a folder
 * oldPath: current folder path/prefix
 * newName: new folder name
 */
export const renameFolder = async (oldPath: string, newName: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/folders/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newName }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('renameFolder response error:', response.status, errorBody);
      throw new Error('Failed to rename folder');
    }
  } catch (error) {
    console.error('Error renaming folder:', error);
    throw error;
  }
};

/**
 * Delete a folder and all its contents
 * folderPath: folder path/prefix to delete
 */
export const deleteFolder = async (folderPath: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting folder:', folderPath);
    
    // Get authentication token
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('📡 DELETE request to:', `${API_URL}/folders/delete`);
    const response = await fetch(`${API_URL}/folders/delete`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ folderPath }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ deleteFolder response error:', response.status, errorBody);
      throw new Error(`Failed to delete folder: ${response.status} ${errorBody}`);
    }
    
    console.log('✅ Folder deleted successfully');
  } catch (error) {
    console.error('💥 Error deleting folder:', error);
    throw error;
  }
};

function formatPrefix(prefix : string): string {
  // If empty or invalid, treat as root
  if (!prefix || typeof prefix !== 'string') {
    return 'Root';
  }

  // Normalize: strip leading/trailing slashes
  const trimmed = prefix.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) {
    return 'Root';
  }

  // Take only the last non-empty path segment (basename)
  const segments = trimmed.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';

  // Convert hyphenated name to Title Case words
  const words = last
    .split('-')
    .filter(Boolean)
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1));

  const result = words.join(' ');
  return result || 'Root';
}