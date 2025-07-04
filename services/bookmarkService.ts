import { Bookmark } from '@/types';
import { getToken } from './authService';

const API_URL = 'http://10.24.64.229:3000';

export const toggleBookmark = async (itemId: string, itemType: 'document' | 'folder', itemName: string): Promise<{ isBookmarked: boolean }> => {
  try {
    console.log('🔖 toggleBookmark called with:', { itemId, itemType, itemName });
    
    const token = await getToken();
    if (!token) {
      console.error('❌ No authentication token found');
      throw new Error('No authentication token found');
    }
    console.log('✅ Token found:', token ? 'yes' : 'no');

    // First check if item is already bookmarked
    console.log('🔍 Checking if item is already bookmarked...');
    const isBookmarked = await checkIfBookmarked(itemId);
    console.log('📋 Item is currently bookmarked:', isBookmarked);
    
    if (isBookmarked) {
      // Remove bookmark
      console.log('🗑️ Removing bookmark...');
      const response = await fetch(`${API_URL}/user/bookmarks/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Remove bookmark response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Remove bookmark failed:', errorText);
        throw new Error('Failed to remove bookmark');
      }

      console.log('✅ Bookmark removed successfully');
      return { isBookmarked: false };
    } else {
      // Add bookmark
      console.log('➕ Adding bookmark...');
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

      console.log('📡 Add bookmark response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Add bookmark failed:', errorText);
        throw new Error('Failed to add bookmark');
      }

      const responseData = await response.json();
      console.log('📦 Add bookmark response data:', responseData);
      console.log('✅ Bookmark added successfully');
      return { isBookmarked: true };
    }
  } catch (error) {
    console.error('💥 Error toggling bookmark:', error);
    throw error;
  }
};

export const getBookmarks = async (): Promise<Bookmark[]> => {
  try {
    console.log('📚 getBookmarks called');
    const token = await getToken();
    if (!token) {
      console.error('❌ No authentication token found in getBookmarks');
      throw new Error('No authentication token found');
    }
    console.log('✅ Token found in getBookmarks:', token ? 'yes' : 'no');

    const response = await fetch(`${API_URL}/user/bookmarks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 getBookmarks response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ getBookmarks failed:', errorText);
      throw new Error('Failed to fetch bookmarks');
    }

    const data = await response.json();
    console.log('📦 getBookmarks response data:', data);
    console.log('📊 Number of bookmarks returned:', data.bookmarks?.length || 0);
    return data.bookmarks || [];
  } catch (error) {
    console.error('💥 Error fetching bookmarks:', error);
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
