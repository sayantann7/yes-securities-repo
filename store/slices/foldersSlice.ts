import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Folder } from '@/types';
import { getFolders, getFolderById } from '@/services/folderService';

interface FoldersState {
  folders: Folder[];
  currentFolder: Folder | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FoldersState = {
  folders: [],
  currentFolder: null,
  isLoading: false,
  error: null,
};

export const fetchFolders = createAsyncThunk(
  'folders/fetchFolders',
  async (parentId: string | null = null) => {
    const response = await getFolders(parentId);
    return response;
  }
);

export const fetchFolderById = createAsyncThunk(
  'folders/fetchFolderById',
  async (id: string) => {
    const response = await getFolderById(id);
    return response;
  }
);

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    clearCurrentFolder(state) {
      state.currentFolder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch folders';
      })
      .addCase(fetchFolderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFolder = action.payload;
      })
      .addCase(fetchFolderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch folder';
      });
  },
});

export const { clearCurrentFolder } = foldersSlice.actions;

export default foldersSlice.reducer;