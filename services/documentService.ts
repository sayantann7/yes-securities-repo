import { Document } from '@/types';

// Mock data for documents
const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'd1',
    name: 'Q2 Sales Report 2025.pdf',
    type: 'pdf',
    size: '2.4 MB',
    url: 'https://example.com/documents/q2-sales-report.pdf',
    createdAt: '2025-06-15',
    author: 'John Doe',
    folderId: 'f1',
    commentCount: 5
  },
  {
    id: 'd2',
    name: 'Investment Strategy Presentation.pdf',
    type: 'pdf',
    size: '5.8 MB',
    url: 'https://example.com/documents/investment-strategy.pdf',
    createdAt: '2025-06-10',
    author: 'Jane Smith',
    folderId: 'f1',
    commentCount: 3
  },
  {
    id: 'd3',
    name: 'Client Meeting Notes.pdf',
    type: 'pdf',
    size: '1.2 MB',
    url: 'https://example.com/documents/client-meeting-notes.pdf',
    createdAt: '2025-06-05',
    author: 'Robert Johnson',
    folderId: 'f2',
    commentCount: 0
  },
  {
    id: 'd4',
    name: 'Market Analysis June 2025.pdf',
    type: 'pdf',
    size: '3.7 MB',
    url: 'https://example.com/documents/market-analysis.pdf',
    createdAt: '2025-06-01',
    author: 'Emily Davis',
    folderId: 'f2',
    commentCount: 8
  },
  {
    id: 'd5',
    name: 'Company Logo.png',
    type: 'image',
    size: '0.5 MB',
    url: 'https://images.pexels.com/photos/5849577/pexels-photo-5849577.jpeg',
    thumbnailUrl: 'https://images.pexels.com/photos/5849577/pexels-photo-5849577.jpeg?auto=compress&cs=tinysrgb&w=300',
    createdAt: '2025-05-20',
    author: 'Michael Wilson',
    folderId: 'f3',
    commentCount: 1
  },
  {
    id: 'd6',
    name: 'Product Presentation Video.mp4',
    type: 'video',
    size: '45.2 MB',
    url: 'https://example.com/documents/product-presentation.mp4',
    createdAt: '2025-05-15',
    author: 'Sarah Thompson',
    folderId: 'f3',
    commentCount: 12
  },
  {
    id: 'd7',
    name: 'Financial Analysis Spreadsheet.xlsx',
    type: 'spreadsheet',
    size: '1.8 MB',
    url: 'https://example.com/documents/financial-analysis.xlsx',
    createdAt: '2025-05-10',
    author: 'David Rodriguez',
    folderId: 'f4',
    content: 'Detailed financial analysis of Q2 2025 performance metrics across all business units',
    commentCount: 7
  },
  {
    id: 'd8',
    name: 'Investment Proposal Template.docx',
    type: 'document',
    size: '0.9 MB',
    url: 'https://example.com/documents/investment-proposal.docx',
    createdAt: '2025-05-05',
    author: 'Jennifer Lee',
    folderId: 'f4',
    content: 'Standard template for creating investment proposals for high-net-worth clients',
    commentCount: 2
  },
];

// In a real app, these would be API calls to a backend server
export const getDocuments = async (folderId: string | null = null): Promise<Document[]> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (folderId) {
    return MOCK_DOCUMENTS.filter(doc => doc.folderId === folderId);
  }
  
  return MOCK_DOCUMENTS;
};

export const getDocumentById = async (id: string): Promise<Document> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const document = MOCK_DOCUMENTS.find(doc => doc.id === id);
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  return document;
};

export const searchDocuments = async (
  query: string,
  filters?: {
    fileTypes?: string[];
    dateRange?: { start: Date | null; end: Date | null };
    authors?: string[];
  }
): Promise<Document[]> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Basic search implementation
  let results = MOCK_DOCUMENTS.filter(doc => 
    doc.name.toLowerCase().includes(query.toLowerCase()) ||
    (doc.content && doc.content.toLowerCase().includes(query.toLowerCase()))
  );
  
  // Apply filters if provided
  if (filters) {
    if (filters.fileTypes && filters.fileTypes.length > 0) {
      results = results.filter(doc => filters.fileTypes?.includes(doc.type));
    }
    
    if (filters.authors && filters.authors.length > 0) {
      results = results.filter(doc => filters.authors?.includes(doc.author));
    }
    
    if (filters.dateRange?.start || filters.dateRange?.end) {
      results = results.filter(doc => {
        const docDate = new Date(doc.createdAt);
        
        if (filters.dateRange?.start && filters.dateRange?.end) {
          return docDate >= filters.dateRange.start && docDate <= filters.dateRange.end;
        } else if (filters.dateRange?.start) {
          return docDate >= filters.dateRange.start;
        } else if (filters.dateRange?.end) {
          return docDate <= filters.dateRange.end;
        }
        
        return true;
      });
    }
  }
  
  return results;
};