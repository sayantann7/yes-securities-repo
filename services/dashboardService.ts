// import api from './api';

export interface WeeklyActivity {
  currentWeek: number;
  lastWeek: number;
  percentageChange: number;
}

export interface UserActivity {
  activeUsers: WeeklyActivity;
  documentAccess: WeeklyActivity;
  timeSpent: WeeklyActivity; // in minutes
}

export interface RecentActivity {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  action: string;
  target: string;
  createdAt: string;
}

export interface AdminDashboardData {
  userActivity: UserActivity;
  recentActivities: RecentActivity[];
  documentsCount: number;
  starredCount: number;
  sharedCount: number;
}

const API_URL = 'http://192.168.3.154:3000/user';

function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

const dashboardService = {
  getAdminDashboardData: async (): Promise<AdminDashboardData> => {
    try {
      const res = await fetch(`${API_URL}/getBiweeklyMetrics`);
      const data = await res.json();
      const { currentWeek, previousWeek } = data;

      return {
        userActivity: {
          activeUsers: {
            currentWeek: currentWeek.signIns || 0,
            lastWeek: previousWeek.signIns || 0,
            percentageChange: getPercentageChange(currentWeek.signIns || 0, previousWeek.signIns || 0),
          },
          documentAccess: {
            currentWeek: currentWeek.documentsViewed || 0,
            lastWeek: previousWeek.documentsViewed || 0,
            percentageChange: getPercentageChange(currentWeek.documentsViewed || 0, previousWeek.documentsViewed || 0),
          },
          timeSpent: {
            currentWeek: currentWeek.timeSpent || 0,
            lastWeek: previousWeek.timeSpent || 0,
            percentageChange: getPercentageChange(currentWeek.timeSpent || 0, previousWeek.timeSpent || 0),
          },
        },
        recentActivities: [], // Not implemented
        documentsCount: 0, // Not implemented
        starredCount: 0, // Not implemented
        sharedCount: 0, // Not implemented
      };
    } catch (err) {
      console.error('Error in getAdminDashboardData:', err);
      throw err;
    }
  },
};

export default dashboardService; 