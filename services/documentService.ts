import { Document } from '@/types';

// Base URL for API requests
const API_URL = 'http://192.168.1.7:3000/api';

// Helper function to determine file type from key
const getFileType = (key: string): string => {
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

// Format file size in a readable way
const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
};

const getDocumentUrl = async (id: string): Promise<string> => {
  return await getDocumentById(id).then(doc => doc.url)
};

export const getDocuments = async (folderId: string | null = null): Promise<Document[]> => {
  try {
    // Ensure API prefix ends with slash if a folderId is provided
    let prefix = '';
    if (folderId) {
      prefix = folderId.endsWith('/') ? folderId : `${folderId}/`;
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
      console.error('Failed to fetch documents, status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error('Failed to fetch documents');
    }

    const data = await response.json();
    console.log('Documents API response:', data); // For debugging
    
    // Transform the files from S3 into Document objects
    const documents: Document[] = [];
    
    // Check if files exists and is an array - FIXED THIS CONDITION
    if (data.files && Array.isArray(data.files)) {
      console.log(`Processing ${data.files.length} files in folder ${prefix || 'root'}`);
      
      for (const item of data.files) {
        // Determine S3 key (string or object), skip invalid/folders
        const key = typeof item === 'string' ? item : item.Key;
        if (!key || key.endsWith('/')) {
          continue;
        }
        const keyParts = key.split('/');
        const fileName = keyParts[keyParts.length - 1];
        // Extract size and lastModified if present
        const sizeBytes = typeof item === 'object' && item.Size ? item.Size : 0;
        const lastModified = typeof item === 'object' && item.LastModified ? item.LastModified : Date.now();
         
         try {
           // Fetch document URL directly without circular dependency
           const urlResponse = await fetch(`${API_URL}/files/fetch`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({ key }),
           });
          
          if (!urlResponse.ok) {
            console.error(`Failed to get URL for ${item.Key}, status:`, urlResponse.status);
            continue;
          }
          
          const urlData = await urlResponse.json();
          
          documents.push({
            id: key,
            name: fileName,
            type: getFileType(fileName),
            size: formatFileSize(sizeBytes),
            url: urlData.url, // Use URL directly from response
            createdAt: new Date(lastModified).toISOString(),
            author: 'Unknown',
            folderId: folderId,
            commentCount: 0
          });
        } catch (err) {
          console.error(`Error processing file ${item.Key}:`, err);
        }
      }
    } else {
      console.log(`No files found in folder ${prefix || 'root'}, only folders`);
    }
    
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const getDocumentById = async (id: string): Promise<Document> => {
  try {
    // First, we need to get the metadata about the document
    const keyParts = id.split('/');
    const fileName = keyParts[keyParts.length - 1];
    const folderId = keyParts.slice(0, -1).join('/') + '/';
    
    // Get the signed URL for viewing/downloading - changed to POST
    const urlResponse = await fetch(`${API_URL}/files/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: id }),
    });

    if (!urlResponse.ok) {
      console.error('Failed to get document URL, status:', urlResponse.status);
      const errorText = await urlResponse.text();
      console.error('Error response:', errorText);
      throw new Error('Failed to get document URL');
    }

    const urlData = await urlResponse.json();
    console.log('Document URL response:', urlData); // For debugging
    
    // Since we don't have a direct way to get full metadata from just the key,
    // we'll create a document object with available information
    return {
      id: id,
      name: fileName,
      type: getFileType(fileName),
      size: 'Unknown', // Would need separate call to get size
      url: urlData.url,
      createdAt: new Date().toISOString(),
      author: 'Unknown', // S3 doesn't provide author information
      folderId: folderId,
      commentCount: 0 // Needs separate tracking system
    };
  } catch (error) {
    console.error('Error getting document:', error);
    throw new Error('Document not found');
  }
};

// Helper to fetch subfolder prefixes from the API for a given prefix
async function fetchFolderPrefixes(prefix: string): Promise<string[]> {
  const response = await fetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix })
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.folders) ? data.folders : [];
}

export const searchDocuments = async (
  query: string,
  filters?: {
    fileTypes?: string[];
    dateRange?: { start: Date | null; end: Date | null };
    authors?: string[];
  }
): Promise<Document[]> => {
  try {
    // Recursively fetch all documents across all folder prefixes
    const allDocuments: Document[] = [];
    const queue: string[] = ['']; // start with root prefix ''
    while (queue.length > 0) {
      const prefix = queue.shift()!;
      // Fetch documents under this prefix
      const docs = await getDocuments(prefix || null);
      allDocuments.push(...docs);
      // Fetch subfolder prefixes for recursion
      const subfolderPrefixes = await fetchFolderPrefixes(prefix);
      queue.push(...subfolderPrefixes);
    }
     
    // Lowercase query for case-insensitive search
    const lowerQuery = query.toLowerCase();

    // Filter documents based on search query (name or content)
    let results = allDocuments.filter(doc =>
      doc.name.toLowerCase().includes(lowerQuery) ||
      (doc.content?.toLowerCase().includes(lowerQuery) ?? false)
    );

    // Apply additional filters
    if (filters) {
      if (filters.fileTypes && filters.fileTypes.length > 0) {
        results = results.filter(doc => filters.fileTypes?.includes(doc.type));
      }
      
      if (filters.dateRange?.start || filters.dateRange?.end) {
        results = results.filter(doc => {
          const docDate = new Date(doc.createdAt);
          
          if (filters.dateRange?.start && filters.dateRange?.end) {
            return docDate >= filters.dateRange.start && docDate <= filters.dateRange.end;
          } else if (filters.dateRange?.start) {
            return docDate >= filters.dateRange.start;
          } else if (filters.dateRange?.end) {
            return docDate <= filters.dateRange.end;
          }
          
          return true;
        });
      }
      
      // Author filtering is less relevant with S3 but keeping for UI compatibility
      if (filters.authors && filters.authors.length > 0) {
        results = results.filter(doc => filters.authors?.includes(doc.author));
      }
    }
    
    // Debug logs to verify search results
    console.log(`searchDocuments: totalDocs=${allDocuments.length}, query="${query}", filtered=${results.length}`);
    return results;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};