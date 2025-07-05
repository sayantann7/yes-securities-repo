import { Comment, AdminCommentView } from '@/types';
import { getToken } from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_URL = `${API_BASE_URL}/user`;

export const adminCommentService = {
  // Get all comments grouped by document (admin only)
  getAllCommentsGrouped: async (): Promise<AdminCommentView[]> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/admin/comments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      return data.documents || [];
    } catch (error: any) {
      console.error('Error fetching admin comments:', error);
      throw new Error(error.message || 'Failed to fetch comments');
    }
  },

  // Get comments for a specific document (admin only)
  getDocumentComments: async (documentId: string): Promise<Comment[]> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/admin/comments/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch document comments');
      }

      return data.comments.map((comment: any) => ({
        id: comment.id,
        documentId: comment.documentId,
        text: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.userId,
          name: comment.user?.fullname || 'User',
          avatar: comment.user?.avatarUrl || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
          email: comment.user?.email
        },
        replies: []
      }));
    } catch (error: any) {
      console.error('Error fetching document comments:', error);
      throw new Error(error.message || 'Failed to fetch document comments');
    }
  },

  // Reply to a comment as admin
  replyToComment: async (documentId: string, replyText: string, originalCommentId?: string): Promise<Comment> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/admin/comment-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId,
          comment: replyText,
          originalCommentId
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add reply');
      }

      return {
        id: data.comment.id,
        documentId: data.comment.documentId,
        text: data.comment.content,
        createdAt: data.comment.createdAt,
        author: {
          id: data.comment.userId,
          name: 'Admin',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
        },
        replies: []
      };
    } catch (error: any) {
      console.error('Error adding admin reply:', error);
      throw new Error(error.message || 'Failed to add reply');
    }
  },

  // Delete a comment (admin only)
  deleteComment: async (commentId: string): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/admin/comment/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      throw new Error(error.message || 'Failed to delete comment');
    }
  },
};
