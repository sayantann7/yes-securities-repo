import { Notification, InactiveUser, UserMetrics, UserOverallMetrics } from '@/types';
import { getToken } from './authService';
import { API_BASE_URL } from '@/constants/api';

const API_URL = `${API_BASE_URL}/user`;

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      return data.notifications || [];
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  },

  // Send notification when new comment is added
  sendCommentNotification: async (documentId: string, commentText: string): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/notifications/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId,
          commentText: commentText.substring(0, 100) + (commentText.length > 100 ? '...' : '')
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send comment notification');
      }
    } catch (error: any) {
      console.error('Error sending comment notification:', error);
      // Don't throw error as this is secondary functionality
    }
  },

  // Send notification when new file is uploaded (admin only)
  sendUploadNotification: async (fileName: string, folderPath?: string): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/notifications/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName,
          folderPath: folderPath || 'Root'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send upload notification');
      }
    } catch (error: any) {
      console.error('Error sending upload notification:', error);
      // Don't throw error as this is secondary functionality
    }
  },
};

export const adminNotificationService = {
  // Get inactive users (admin only)
  getInactiveUsers: async (daysSinceLastSignIn: number = 7): Promise<InactiveUser[]> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/admin/inactive-users?days=${daysSinceLastSignIn}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inactive users');
      }

      return data.inactiveUsers || [];
    } catch (error: any) {
      console.error('Error fetching inactive users:', error);
      throw new Error(error.message || 'Failed to fetch inactive users');
    }
  },


  // Ping/alert inactive users (admin only)
  pingInactiveUsers: async (userIds: string[], message: string): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/admin/ping-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds,
          message
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to ping users');
      }
    } catch (error: any) {
      console.error('Error pinging users:', error);
      throw new Error(error.message || 'Failed to ping users');
    }
  },

  // Get all users with comprehensive metrics (admin only)
  getUsersMetrics: async (): Promise<{ users: UserMetrics[]; overallMetrics: UserOverallMetrics }> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/admin/users-metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch user metrics');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error fetching user metrics:', error);
      throw new Error(error.message || 'Failed to fetch user metrics');
    }
  },
};
