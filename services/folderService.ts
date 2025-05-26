import { Folder, Document } from '@/types';
import { getDocuments } from './documentService';

// Mock data for folders
const MOCK_FOLDERS: Folder[] = [
  {
    id: 'f1',
    name: 'Sales Reports',
    parentId: null,
    createdAt: '2025-06-20',
    itemCount: 7
  },
  {
    id: 'f2',
    name: 'Client Documents',
    parentId: null,
    createdAt: '2025-06-18',
    itemCount: 12
  },
  {
    id: 'f3',
    name: 'Marketing Materials',
    parentId: null,
    createdAt: '2025-06-15',
    itemCount: 5
  },
  {
    id: 'f4',
    name: 'Templates',
    parentId: null,
    createdAt: '2025-06-10',
    itemCount: 3
  },
  {
    id: 'f5',
    name: 'Q2 2025',
    parentId: 'f1',
    createdAt: '2025-06-05',
    itemCount: 4
  },
  {
    id: 'f6',
    name: 'Q1 2025',
    parentId: 'f1',
    createdAt: '2025-03-10',
    itemCount: 3
  },
  {
    id: 'f7',
    name: 'High-Value Clients',
    parentId: 'f2',
    createdAt: '2025-06-02',
    itemCount: 8
  },
  {
    id: 'f8',
    name: 'Prospective Clients',
    parentId: 'f2',
    createdAt: '2025-05-28',
    itemCount: 4
  },
  {
    id: 'f9',
    name: 'Brochures',
    parentId: 'f3',
    createdAt: '2025-05-20',
    itemCount: 3
  },
  {
    id: 'f10',
    name: 'Presentations',
    parentId: 'f3',
    createdAt: '2025-05-15',
    itemCount: 2
  },
  {
    id: 'f11',
    name: 'Investment Plans',
    parentId: 'f4',
    createdAt: '2025-05-10',
    itemCount: 1
  },
  {
    id: 'f12',
    name: 'Proposal Templates',
    parentId: 'f4',
    createdAt: '2025-05-05',
    itemCount: 2
  }
];

// In a real app, these would be API calls to a backend server
export const getFolders = async (parentId: string | null = null): Promise<Folder[]> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return MOCK_FOLDERS.filter(folder => folder.parentId === parentId);
};

export const getFolderById = async (id: string): Promise<Folder> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const folder = MOCK_FOLDERS.find(folder => folder.id === id);
  
  if (!folder) {
    throw new Error('Folder not found');
  }
  
  return folder;
};

export const getFolderContents = async (folderId: string): Promise<{ folders: Folder[], documents: Document[] }> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const folders = await getFolders(folderId);
  const documents = await getDocuments(folderId);
  
  return { folders, documents };
};