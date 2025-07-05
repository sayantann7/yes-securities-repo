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
      console.error('Error reloading folders:', err);
      setError('Failed to reload folders');
    }
  };
  return { folders, rootFolders, documents, isLoading, error, reload };
}