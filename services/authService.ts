import { User } from '@/context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

const API_URL = `${API_BASE_URL}`;

// Export this helper function so it can be used elsewhere
export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('auth_token');
  } else {
    return await SecureStore.getItemAsync('auth_token');
  }
};

export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const response = await fetch(`${API_URL}/user/signin`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      console.log('Login response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      // Transform backend response to match frontend expected format
      const userData: User = {
        id: data.user.id,
        name: data.user.fullname,
        email: data.user.email,
        role: data.user.role,
      };
      
      return {
        token: data.token,
        user: userData
      };
    } catch (error: any) {
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Network error. Please check your connection.');
    }
  },
  
  getUserProfile: async (): Promise<User> => {
    // This would typically use the token to fetch the user profile
    // Since your backend doesn't have a dedicated endpoint for this yet,
    // we'll rely on the data stored after login
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Get user from stored data
    // In a complete implementation, you would fetch this from the backend
    const userData = getUserDataFromToken(token);
    return userData;
  },
  
  refreshToken: async (): Promise<string> => {
    // Your backend doesn't have a refresh token endpoint yet
    // This would be implemented when your backend supports it
    throw new Error('Refresh token not implemented');
  },
  
  updateProfile: async (fullname: string, email: string): Promise<User> => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fullname, email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      const updated = data.user;
      const userData: User = {
        id: updated.id,
        name: updated.fullname,
        email: updated.email,
        role: updated.role,
        avatar: updated.avatar,
      };
      return userData;
    } catch (error: any) {
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Network error. Please check your connection.');
    }
  }
};

// Helper function to extract user data from JWT token
const getUserDataFromToken = (token: string): User => {
  try {
    // Decode the JWT token (simple decode, not verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // This assumes your backend includes user details in the token
    // You may need to adjust based on what's actually in your token
    return {
      id: payload.userId,
      email: payload.email,
      name: '', // These fields aren't in the token
      role: 'sales', // Using default values
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return {
      id: '',
      name: '',
      email: '',
      role: 'sales',
    };
  }
};