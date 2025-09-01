import { Notification, InactiveUser, UserMetrics, UserOverallMetrics } from '@/types';
import { swr, invalidateCache } from './cache';
import { getToken } from './authService';
import { API_BASE_URL } from '@/constants/api';

const API_URL = `${API_BASE_URL}`; // base

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

      const list = Array.isArray(data.notifications) ? data.notifications : [];
      // Normalize items so comment entries include documentId and readable title/message
      return list.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title || (n.type === 'comment' ? 'New comment' : 'Notification'),
        message: n.message || n.commentText || n.preview || '',
        read: !!n.read,
        createdAt: n.createdAt,
        userId: n.userId,
        documentId: n.documentId || n.itemId || undefined,
        senderId: n.senderId,
        sender: n.sender ? { id: n.sender.id, name: n.sender.name, avatar: n.sender.avatarUrl } : undefined,
      }));
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
        method: 'POST',
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

      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
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

  const response = await fetch(`${API_URL}/user/notifications/comment`, {
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

  const response = await fetch(`${API_URL}/user/notifications/upload`, {
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

// Helper to quickly get unread count without fetching full list
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const token = await getToken();
    if (!token) return 0;
    const resp = await fetch(`${API_URL}/notifications?unread=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) return 0;
    const data = await resp.json();
    return Array.isArray(data.notifications) ? data.notifications.length : 0;
  } catch {
    return 0;
  }
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
  getUsersMetricsPage: async (params?: { cursor?: string; limit?: number; q?: string; sort?: string; order?: 'asc'|'desc'; activity?: string; includeOverall?: boolean }): Promise<{ users: UserMetrics[]; pageInfo: { nextCursor: string|null; hasNextPage: boolean; count: number }; overallMetrics?: UserOverallMetrics | null }> => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.q) searchParams.set('q', params.q);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.activity) searchParams.set('activity', params.activity);
    if (params?.includeOverall) searchParams.set('includeOverall', '1');
    const url = `${API_URL}/admin/users-metrics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch users metrics page');
    return data;
  },
  invalidateUsersMetrics: () => invalidateCache('users:metrics'), // retained for legacy compatibility
};
