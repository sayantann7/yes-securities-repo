import { configureStore } from '@reduxjs/toolkit';
import documentsReducer from './slices/documentsSlice';
import foldersReducer from './slices/foldersSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    documents: documentsReducer,
    folders: foldersReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;