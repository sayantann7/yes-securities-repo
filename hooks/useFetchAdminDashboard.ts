import { useState, useEffect } from 'react';
import dashboardService, { AdminDashboardData } from '@/services/dashboardService';

export function useFetchAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardService.getAdminDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch admin dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { dashboardData, isLoading, error };
} 