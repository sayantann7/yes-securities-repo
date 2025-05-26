import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Document } from '@/types';
import { getDocuments, getDocumentById } from '@/services/documentService';

interface DocumentsState {
  documents: Document[];
  currentDocument: Document | null;
  recentDocuments: Document[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  documents: [],
  currentDocument: null,
  recentDocuments: [],
  isLoading: false,
  error: null,
};

export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (folderId: string | null = null) => {
    const response = await getDocuments(folderId);
    return response;
  }
);

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchDocumentById',
  async (id: string) => {
    const response = await getDocumentById(id);
    return response;
  }
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    addRecentDocument(state, action: PayloadAction<Document>) {
      // Remove the document if it already exists in recents
      state.recentDocuments = state.recentDocuments.filter(
        doc => doc.id !== action.payload.id
      );
      
      // Add the document to the beginning of the list
      state.recentDocuments.unshift(action.payload);
      
      // Keep only the 10 most recent documents
      if (state.recentDocuments.length > 10) {
        state.recentDocuments = state.recentDocuments.slice(0, 10);
      }
    },
    clearCurrentDocument(state) {
      state.currentDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch documents';
      })
      .addCase(fetchDocumentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDocument = action.payload;
        
        // Add to recent documents
        if (action.payload) {
          const exists = state.recentDocuments.some(
            doc => doc.id === action.payload.id
          );
          
          if (!exists) {
            state.recentDocuments.unshift(action.payload);
            
            if (state.recentDocuments.length > 10) {
              state.recentDocuments = state.recentDocuments.slice(0, 10);
            }
          }
        }
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch document';
      });
  },
});

export const { addRecentDocument, clearCurrentDocument } = documentsSlice.actions;

export default documentsSlice.reducer;