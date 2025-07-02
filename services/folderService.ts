import { Folder, Document } from '@/types';
import { getDocuments } from './documentService';

// Keep your existing API URL or update to localhost if testing locally
const API_URL = 'http://10.24.64.229:3000/api';

export const getFolders = async (parentId: string | null = null): Promise<Folder[]> => {
  try {
    // Normalize prefix: ensure trailing slash if parentId provided
    let prefix = '';
    if (parentId) {
      prefix = parentId.endsWith('/') ? parentId : `${parentId}/`;
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
    
    // Transform the response into the Folder format expected by the frontend
    const folders: Folder[] = [];
    
    // Check if CommonPrefixes exists and is an array
    if (data.folders && Array.isArray(data.folders)) {
      // Use Promise.all to fetch document counts concurrently
      await Promise.all(data.folders.map(async (folderPrefix: any) => {
        const name = formatPrefix(folderPrefix);
        // Fetch documents for the current folder to get the itemCount
        const documents = await getDocuments(folderPrefix);
        
        folders.push({
          id: folderPrefix, 
          name: name,
          parentId: parentId,
          createdAt: new Date().toISOString(),
          itemCount: documents.length, // Set itemCount to the number of documents
        });
      }));
    }
    
    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getFolderData = async (folderId: string | null = null): Promise<Folder> => {
  try {
    let prefix = '';
    if (folderId) {
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
    // Fetch documents for the current folder to get the itemCount
    const documents = await getDocuments(prefix);

    // parentId is the input folderId's parent, which is not available here, so set as null or as needed
    return {
      id: prefix,
      name: name,
      parentId: null, // Or determine the parentId if possible/needed
      createdAt: new Date().toISOString(),
      itemCount: documents.length // Set itemCount to the number of documents
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
 */
export const createFolder = async (parentId: string | null, name: string): Promise<void> => {
  try {
    // Determine prefix path
    let prefix = '';
    if (parentId) {
      prefix = parentId.endsWith('/') ? parentId : `${parentId}/`;
    }
    // Call API to create folder at its own endpoint
    const response = await fetch(`${API_URL}/folders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, name }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('createFolder response error:', response.status, errorBody);
      throw new Error('Failed to create folder');
    }
  } catch (error) {
    console.error('Error creating folder:', error);
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
    const response = await fetch(`${API_URL}/folders/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('deleteFolder response error:', response.status, errorBody);
      throw new Error('Failed to delete folder');
    }
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

function formatPrefix(prefix : string): string {
  // 1. Strip off any trailing slash (if present)
  const noSlash = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;

  // 2. Split on hyphens
  const parts = noSlash.split('-');

  // 3. Capitalize each chunk and join with spaces
  const words = parts.map(chunk => {
    if (chunk.length === 0) return ''; 
    return chunk[0].toUpperCase() + chunk.slice(1);
  });

  // 4. Filter out any accidental empty segments and join
  return words.filter(w => w !== '').join(' ');
}