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
  const [trigger, setTrigger] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all folders to build the folder structure
        const allFolders = await getFolders(null);
        // Sort all folders alphabetically by name
        const sortedAllFolders = allFolders.sort((a, b) => a.name.localeCompare(b.name));
        setFolders(sortedAllFolders);
        
        // Fetch root folders or subfolders based on the folderId
        const foldersList = await getFolders(folderId);
        // Sort folders alphabetically by name
        const sortedFolders = foldersList.sort((a, b) => a.name.localeCompare(b.name));
        setRootFolders(sortedFolders);
        
        // Fetch documents for the current folder
        const documentsList = await getDocuments(folderId);
        // Sort documents alphabetically by name
        const sortedDocuments = documentsList.sort((a, b) => a.name.localeCompare(b.name));
        setDocuments(sortedDocuments);
        
      } catch (err) {
        console.error('Error fetching folders:', err);
        setError('Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [folderId, trigger]);
  
  /**
   * Call to reload folders and documents.
   */
  const reload = () => setTrigger(prev => prev + 1);
  return { folders, rootFolders, documents, isLoading, error, reload };
}