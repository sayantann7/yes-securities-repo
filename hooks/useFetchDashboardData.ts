import { useState, useEffect } from 'react';
import { Document } from '@/types';
import { getDocuments } from '@/services/documentService';

export function useFetchDashboardData() {
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [popularDocuments, setPopularDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all documents
        const documents = await getDocuments();
        
        // Sort by date for recent documents
        const sorted = [...documents].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setRecentDocuments(sorted.slice(0, 5));
        
        // Sort by comment count for popular documents
        const popular = [...documents].sort((a, b) => {
          return (b.commentCount || 0) - (a.commentCount || 0);
        });
        
        setPopularDocuments(popular.slice(0, 5));
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return { recentDocuments, popularDocuments, isLoading, error };
}