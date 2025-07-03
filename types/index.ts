export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  itemCount?: number;
  iconUrl?: string;
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