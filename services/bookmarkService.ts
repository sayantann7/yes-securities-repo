import { Bookmark } from '@/types';
import { getToken } from './authService';

const API_URL = 'http://10.24.64.229:3000';

export const toggleBookmark = async (itemId: string, itemType: 'document' | 'folder', itemName: string): Promise<{ isBookmarked: boolean }> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // First check if item is already bookmarked
    const isBookmarked = await checkIfBookmarked(itemId);
    
    if (isBookmarked) {
      // Remove bookmark
      const response = await fetch(`${API_URL}/user/bookmarks/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove bookmark');
      }

      return { isBookmarked: false };
    } else {
      // Add bookmark
      const response = await fetch(`${API_URL}/user/bookmarks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          itemType,
          itemName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add bookmark');
      }

      return { isBookmarked: true };
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
};

export const getBookmarks = async (): Promise<Bookmark[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/user/bookmarks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookmarks');
    }

    const data = await response.json();
    return data.bookmarks;
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
};

export const checkIfBookmarked = async (itemId: string): Promise<boolean> => {
  try {
    const bookmarks = await getBookmarks();
    return bookmarks.some(bookmark => bookmark.itemId === itemId);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

export const addBookmark = async (itemId: string, itemType: 'document' | 'folder', itemName: string): Promise<void> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/user/bookmarks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemId,
        itemType,
        itemName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add bookmark');
    }
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
};

export const removeBookmark = async (itemId: string): Promise<void> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/user/bookmarks/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove bookmark');
    }
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};
