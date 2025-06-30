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

const dashboardService = {
  getAdminDashboardData: async (): Promise<AdminDashboardData> => {
    // In a real app, you'd fetch this from your backend
    // const response = await api.get('/dashboard/admin');
    // return response.data;

    // For now, returning mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          userActivity: {
            activeUsers: {
              currentWeek: 150,
              lastWeek: 120,
              percentageChange: 25,
            },
            documentAccess: {
              currentWeek: 850,
              lastWeek: 920,
              percentageChange: -7.6,
            },
            timeSpent: { // in minutes
              currentWeek: 7500,
              lastWeek: 6800,
              percentageChange: 10.3,
            },
          },
          recentActivities: [
            {
              id: '1',
              user: { id: 'u1', name: 'Alice', avatar: '/avatar.jpg' },
              action: 'viewed',
              target: 'Q3 Financial Report.pdf',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            },
            {
                id: '2',
                user: { id: 'u2', name: 'Bob', avatar: '/avatar.jpg' },
                action: 'commented on',
                target: 'Marketing Plan.docx',
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
            },
            {
                id: '3',
                user: { id: 'u3', name: 'Charlie', avatar: '/avatar.jpg' },
                action: 'shared',
                target: 'Competitor Analysis.pptx',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            },
          ],
          documentsCount: 253,
          starredCount: 18,
          sharedCount: 7,
        });
      }, 500);
    });
  },
};

export default dashboardService; 