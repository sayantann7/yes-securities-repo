import { useState, useEffect } from 'react';
import { Folder, Document } from '@/types';
import { getFolders } from '@/services/folderService';
import { getDocuments } from '@/services/documentService';

export function useFetchFolders(folderId: string | null = null) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [rootFolders, setRootFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all folders to build the folder structure
        const allFolders = await getFolders(null);
        setFolders(allFolders);
        
        // Fetch root folders or subfolders based on the folderId
        const foldersList = await getFolders(folderId);
        setRootFolders(foldersList);
        
        // Fetch documents for the current folder
        const documentsList = await getDocuments(folderId);
        setDocuments(documentsList);
        
      } catch (err) {
        console.error('Error fetching folders:', err);
        setError('Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [folderId]);
  
  return { folders, rootFolders, documents, isLoading, error };
}