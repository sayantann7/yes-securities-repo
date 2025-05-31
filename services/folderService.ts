import { Folder, Document } from '@/types';
import { getDocuments } from './documentService';

// Keep your existing API URL or update to localhost if testing locally
const API_URL = 'http://192.168.1.34:3000/api';

export const getFolders = async (parentId: string | null = null): Promise<Folder[]> => {
  try {
    let prefix = '';
    if (parentId) {
      prefix = parentId;
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
      data.folders.forEach((prefix: any) => {

        const name = formatPrefix(prefix);
        
        folders.push({
          id: prefix, 
          name: name,
          parentId: parentId,
          createdAt: new Date().toISOString(),
          itemCount: 0,
        });
      });
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

    // parentId is the input folderId's parent, which is not available here, so set as null or as needed
    return {
      id: prefix,
      name: name,
      parentId: null,
      createdAt: new Date().toISOString(),
      itemCount: Array.isArray(data.folders) ? data.folders.length : 0
    };

  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getFolderContents = async (folderId: string | null = null): Promise<{ folders: any[]; files: any[] }> => {
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

    // Assuming data.files is an array, not using shift() to avoid removing the first element
    const files = Array.isArray(data.files) ? data.files : [];

    const folderData = { 
      folders: Array.isArray(data.folders) ? data.folders : [],
      files: files
    };

    return folderData;
  } catch (error) {
    console.error('Error fetching folders:', error);
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