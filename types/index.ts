export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  itemCount?: number;
  iconUrl?: string;
  isBookmarked?: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  author: string;
  folderId: string | null;
  content?: string;
  commentCount?: number;
  iconUrl?: string;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  documentId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  parentId?: string;
  replies: Comment[];
}

export interface Notification {
  id: string;
  type: 'comment' | 'upload' | 'ping' | 'alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  documentId?: string;
  senderId?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface AdminCommentView {
  documentId: string;
  documentName: string;
  comments: Comment[];
}

export interface InactiveUser {
  id: string;
  name: string;
  email: string;
  lastSignIn: string;
  daysInactive: number;
}

export interface UserMetrics {
  id: string;
  fullname: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignIn: string | null;
  numberOfSignIns: number;
  documentsViewed: number;
  timeSpent: number; // in minutes
  recentDocs: string[];
  daysInactive?: number;
}

export interface UserOverallMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  averageTimeSpent: number;
  totalDocumentViews: number;
  averageSignIns: number;
  newUsersThisWeek: number;
  mostActiveUser: {
    name: string;
    timeSpent: number;
  };
}

export interface UserActivityStatus {
  status: 'active' | 'inactive' | 'new';
  color: string;
  description: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'document' | 'folder';
  itemName: string;
  createdAt: string;
}