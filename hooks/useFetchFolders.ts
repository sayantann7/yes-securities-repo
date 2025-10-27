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
        
        // Add minimum loading time to ensure skeleton is visible
        const startTime = Date.now();
        const minLoadingTime = 800; // 800ms minimum loading time
        
        const [allFolders, foldersList, documentsList] = await Promise.all([
          getFolders(null),
          getFolders(folderId),
          getDocuments(folderId)
        ]);

        setFolders(allFolders.sort((a, b) => a.name.localeCompare(b.name)));
        setRootFolders(foldersList.sort((a, b) => a.name.localeCompare(b.name)));
        setDocuments(documentsList.sort((a, b) => a.name.localeCompare(b.name)));
        
        // Ensure minimum loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
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
   * This function does not set isLoading to true since it's meant for refresh operations
   * where the UI should show refresh indicators instead of the skeleton loader.
   */
  const reload = async () => {
    try {
      const [allFolders, foldersList, documentsList] = await Promise.all([
        getFolders(null),
        getFolders(folderId),
        getDocuments(folderId)
      ]);

      setFolders(allFolders.sort((a, b) => a.name.localeCompare(b.name)));
      setRootFolders(foldersList.sort((a, b) => a.name.localeCompare(b.name)));
      setDocuments(documentsList.sort((a, b) => a.name.localeCompare(b.name)));
      
    } catch (err) {
      console.error('Error reloading folders:', err);
      setError('Failed to reload folders');
    }
  };
  return { folders, rootFolders, documents, isLoading, error, reload };
}