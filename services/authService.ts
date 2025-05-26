import { User } from '@/context/AuthContext';

// Mock data for authentication
const MOCK_USER: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@yessecurities.com',
  role: 'sales',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
};

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4OTAyMzkwMjJ9.fxB2Q9H2dP5PKI6G8LVX9TdCvO4XyzCOMzx-iY0vwQw';

// In a real app, these would be API calls to a backend server
export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (email.trim() === '' || password.trim() === '') {
      throw new Error('Email and password are required');
    }
    
    // For demo purposes, accept any email/password combination
    // In a real app, this would validate credentials against a backend
    
    return {
      token: MOCK_TOKEN,
      user: MOCK_USER
    };
  },
  
  getUserProfile: async (): Promise<User> => {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, this would fetch the user profile from a backend using the stored token
    return MOCK_USER;
  },
  
  refreshToken: async (): Promise<string> => {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, this would send the refresh token to get a new access token
    return MOCK_TOKEN;
  }
};