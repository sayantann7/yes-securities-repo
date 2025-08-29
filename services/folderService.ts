import { Folder, Document } from '@/types';
import { getDocuments } from './documentService';
import { getToken } from './authService';
import { API_URL } from '@/constants/api';

export const getFolders = async (parentId: string | null = null): Promise<Folder[]> => {
  try {
    // Normalize prefix: ensure trailing slash if parentId provided
    let prefix = '';
    if (parentId && typeof parentId === 'string' && parentId.trim() !== '') {
      prefix = parentId.endsWith('/') ? parentId : `${parentId}/`;
    }

    // Get authentication token
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Changed from GET to POST
    const response = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prefix }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    const data = await response.json();
    
    // Transform the response into the Folder format expected by the frontend
    const folders: Folder[] = [];
    
    // Check if folders array exists and is an array
    if (data.folders && Array.isArray(data.folders)) {
      // Use Promise.all to fetch document counts concurrently
      await Promise.all(data.folders.map(async (folderObj: { key: string, iconUrl?: string, isBookmarked?: boolean }) => {
        const folderPrefix = folderObj.key;

        if (!folderPrefix || typeof folderPrefix !== 'string') {
          console.warn('Invalid folder prefix:', folderPrefix);
          return;
        }

        const name = formatPrefix(folderPrefix);

        // Fetch documents & subfolders concurrently for accurate item count
        const [documents, subfolderCount] = await Promise.all([
          getDocuments(folderPrefix),
          (async () => {
            try {
              // Reuse token retrieval via getToken (avoid passing auth header if not needed inside API)
              const token = await getToken();
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (token) headers['Authorization'] = `Bearer ${token}`;
              const r = await fetch(`${API_URL}/folders`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ prefix: folderPrefix })
              });
              if (!r.ok) return 0;
              const d = await r.json();
              if (d && Array.isArray(d.folders)) return d.folders.length;
              return 0;
            } catch {
              return 0;
            }
          })()
        ]);

        const totalItems = documents.length + subfolderCount;

        folders.push({
          id: folderPrefix,
          name,
          parentId: parentId,
            createdAt: new Date().toISOString(),
          itemCount: totalItems, // files + immediate subfolders
          iconUrl: folderObj.iconUrl,
          isBookmarked: folderObj.isBookmarked || false,
        });

        if (folderObj.iconUrl) {
          console.log('🖼️ Folder icon URL received:', {
            folderName: name,
            iconUrl: folderObj.iconUrl,
            isSignedUrl: folderObj.iconUrl.includes('X-Amz-'),
            urlDomain: new URL(folderObj.iconUrl).hostname
          });
        } else {
          console.log('❌ No icon URL for folder:', name);
        }
      }));
    }
    
    // Sort folders alphabetically by name before returning
    return folders.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getFolderData = async (folderId: string | null = null): Promise<Folder> => {
  try {
    let prefix = '';
    if (folderId && typeof folderId === 'string' && folderId.trim() !== '') {
      prefix = folderId;
    }

    // Changed from GET to POST
    const response = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    const data = await response.json();

    // Use formatPrefix to get the folder name
    const name = formatPrefix(prefix);
    // Fetch documents & subfolders concurrently for accurate item count
    const [documents, subfolderCount] = await Promise.all([
      getDocuments(prefix),
      (async () => {
        try {
          const r = await fetch(`${API_URL}/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix })
          });
          if (!r.ok) return 0;
          const d = await r.json();
          if (d && Array.isArray(d.folders)) return d.folders.length;
          return 0;
        } catch { return 0; }
      })()
    ]);

    // parentId is the input folderId's parent, which is not available here, so set as null or as needed
    return {
      id: prefix,
      name: name,
      parentId: null, // Or determine the parentId if possible/needed
      createdAt: new Date().toISOString(),
  itemCount: documents.length + subfolderCount // files + immediate subfolders
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
  // Reuse getFolders and getDocuments to retrieve properly formatted data
  const folders = await getFolders(folderId);
  const files = await getDocuments(folderId);
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
    
    // After successful upload, get the view URL
    const encodedPath = encodeURIComponent(itemPath);
    console.log('🔍 Retrieving icon URL for path:', encodedPath);
    
    const iconHeaders: Record<string, string> = {};
    if (token) {
      iconHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const iconResponse = await fetch(`${API_URL}/icons/${encodedPath}`, {
      headers: iconHeaders
    });
    
    if (!iconResponse.ok) {
      const iconError = await iconResponse.text();
      console.error('❌ Failed to get icon URL after upload:', iconResponse.status, iconError);
      throw new Error(`Failed to get icon URL after upload: ${iconResponse.status} ${iconError}`);
    }
    
    const { iconUrl } = await iconResponse.json();
    console.log('✅ Icon uploaded and URL retrieved:', iconUrl);
    return iconUrl;
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