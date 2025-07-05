import { Comment } from '@/types';
import { getToken } from './authService';
import { notificationService } from './notificationService';

// Base URL for API requests
const API_URL = 'http://192.168.3.154:3000/user';

// In a real app, these would be API calls to a backend server
export const getComments = async (documentId: string): Promise<Comment[]> => {
  try {
    // Use GET with query param to fetch comments
    const response = await fetch(`${API_URL}/comments?documentId=${encodeURIComponent(documentId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch comments');
    }
    // Transform backend response to match frontend expected format
    return data.comments.map((comment: any) => ({
      id: comment.id,
      documentId: comment.documentId,
      text: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.userId,
        name: comment.user?.fullname || 'User', // use fullname if included
        avatar: comment.user?.avatarUrl || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
      },
      replies: []
    }));
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    throw new Error(error.message || 'Failed to fetch comments');
  }
};

export const addComment = async (comment: Comment): Promise<Comment> => {
  try {
    // Get user email from token or other source
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Get email from stored user data or from token
    const email = comment.author.email || '';
    
    const response = await fetch(`${API_URL}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: email,
        documentId: comment.documentId,
        comment: comment.text
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add comment');
    }
    
    // Transform backend response to match frontend expected format
    const transformedComment = {
      id: data.comment.id,
      documentId: data.comment.documentId,
      text: data.comment.content,
      createdAt: data.comment.createdAt,
      author: {
        id: data.comment.userId,
        name: comment.author.name, // Use the name from the input as backend doesn't return it
        avatar: comment.author.avatar
      },
      replies: []
    };

    return transformedComment;
  } catch (error: any) {
    console.error('Error adding comment:', error);
    throw new Error(error.message || 'Failed to add comment');
  }
};

export const updateComment = async (id: string, text: string): Promise<Comment> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // First, we need to get the document ID, as your backend requires it
    // This would typically come from the comment itself
    // For simplicity, let's assume we have it
    const documentId = ''; // This would need to be provided
    
    const response = await fetch(`${API_URL}/comment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        documentId,
        comment: text
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update comment');
    }
    
    // Transform backend response to match frontend expected format
    return {
      id: data.comment.id,
      documentId: data.comment.documentId,
      text: data.comment.content,
      createdAt: data.comment.createdAt,
      author: {
        id: data.comment.userId,
        name: 'User', // Backend doesn't return author name
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
      },
      replies: []
    };
  } catch (error: any) {
    console.error('Error updating comment:', error);
    throw new Error(error.message || 'Failed to update comment');
  }
};

export const deleteComment = async (id: string, documentId: string, text: string): Promise<void> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/comment`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        documentId,
        comment: text
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete comment');
    }
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    throw new Error(error.message || 'Failed to delete comment');
  }
};