import { Comment } from '@/types';

// Mock data for comments
const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    documentId: 'd1',
    text: 'Great report! The Q2 numbers look really promising.',
    createdAt: '2025-06-17T14:30:00Z',
    author: {
      id: '1',
      name: 'John Doe',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
    },
    replies: [
      {
        id: 'c2',
        documentId: 'd1',
        text: 'I agree, especially with the new client acquisition metrics.',
        createdAt: '2025-06-17T15:45:00Z',
        author: {
          id: '2',
          name: 'Jane Smith',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'
        },
        parentId: 'c1',
        replies: []
      }
    ]
  },
  {
    id: 'c3',
    documentId: 'd1',
    text: 'We should present this at the next board meeting.',
    createdAt: '2025-06-16T09:20:00Z',
    author: {
      id: '3',
      name: 'Robert Johnson',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'
    },
    replies: []
  },
  {
    id: 'c4',
    documentId: 'd2',
    text: 'This investment strategy aligns well with our current market outlook.',
    createdAt: '2025-06-15T11:05:00Z',
    author: {
      id: '4',
      name: 'Emily Davis',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
    },
    replies: [
      {
        id: 'c5',
        documentId: 'd2',
        text: 'I have some concerns about the risk assessment on page 15.',
        createdAt: '2025-06-15T13:30:00Z',
        author: {
          id: '5',
          name: 'Michael Wilson',
          avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg'
        },
        parentId: 'c4',
        replies: []
      },
      {
        id: 'c6',
        documentId: 'd2',
        text: 'Good point, Michael. We should revise that section.',
        createdAt: '2025-06-15T14:15:00Z',
        author: {
          id: '4',
          name: 'Emily Davis',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
        },
        parentId: 'c4',
        replies: []
      }
    ]
  }
];

// In a real app, these would be API calls to a backend server
export const getComments = async (documentId: string): Promise<Comment[]> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return MOCK_COMMENTS.filter(comment => comment.documentId === documentId);
};

export const addComment = async (comment: Comment): Promise<Comment> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a real app, this would send the comment to a backend server
  // For now, we'll just return the comment as if it was saved
  return comment;
};

export const updateComment = async (id: string, text: string): Promise<Comment> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Find the comment to update
  const commentToUpdate = findCommentById(id, MOCK_COMMENTS);
  
  if (!commentToUpdate) {
    throw new Error('Comment not found');
  }
  
  // Update the comment
  commentToUpdate.text = text;
  commentToUpdate.updatedAt = new Date().toISOString();
  
  return commentToUpdate;
};

export const deleteComment = async (id: string): Promise<void> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a real app, this would send a delete request to a backend server
  // For now, we'll just simulate success
};

// Helper function to find a comment by ID recursively
const findCommentById = (id: string, comments: Comment[]): Comment | null => {
  for (const comment of comments) {
    if (comment.id === id) {
      return comment;
    }
    
    if (comment.replies && comment.replies.length > 0) {
      const found = findCommentById(id, comment.replies);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
};