# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo document management application for YES Securities sales team. The app provides secure document storage, sharing, and management capabilities with role-based access control and real-time commenting features.

## Development Commands

### Core Commands
- `npm run dev` - Start Expo development server (with telemetry disabled)
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run build:web` - Build for web platform
- `npm run lint` - Run Expo linting

### Platform-Specific Development
- Use `expo run:android` for Android development
- Use `expo run:ios` for iOS development
- Web platform supported via Metro bundler

## Architecture Overview

### Core Technologies
- **React Native 0.79.1** with **Expo 53.0.0**
- **Expo Router** for file-based routing with typed routes
- **Redux Toolkit** for state management
- **TypeScript** for type safety
- **JWT authentication** with secure token storage

### Application Structure

#### Authentication & State Management
- **AuthContext** (`context/AuthContext.tsx`) - JWT-based authentication with role-based access (admin/manager/sales)
- **Redux Store** (`store/`) - Centralized state for documents, folders, and user data
- **Secure Storage** - Cross-platform token storage (SecureStore on native, localStorage on web)

#### Routing Architecture
- **File-based routing** with Expo Router
- **Root Layout** (`app/_layout.tsx`) - Global providers and font loading
- **Auth Layout** (`app/(auth)/`) - Authentication screens
- **App Layout** (`app/(app)/`) - Main application screens with tab navigation

#### Key Features
- **Document Management** - Upload, view, and organize documents with folder structure
- **Real-time Comments** - Threaded commenting system on documents
- **Bookmarking System** - Save documents and folders for quick access
- **Admin Dashboard** - User management, analytics, and notification system
- **Search & Filter** - Advanced document search with filtering capabilities
- **Multi-format Support** - PDF viewing, image viewing, video playback

#### Services Layer
All API interactions are handled through dedicated service modules:
- `authService.ts` - Authentication and user profile management
- `documentService.ts` - Document CRUD operations
- `folderService.ts` - Folder management
- `commentService.ts` - Comment system
- `notificationService.ts` - Push notifications and alerts
- `bookmarkService.ts` - Bookmark management
- `dashboardService.ts` - Analytics and dashboard data

#### Component Organization
- **Feature-based components** in `components/` directory
- **Skeleton loaders** for improved UX during data loading
- **Modal components** for document actions and uploads
- **Custom viewers** for different file types (PDF, image, video)

### Font System
- **Custom Nexa fonts** are applied globally to all Text and TextInput components
- **Global overrides** ensure consistent typography throughout the app

### Type Safety
- Comprehensive TypeScript interfaces in `types/index.ts`
- Strong typing for all API responses and component props
- Redux state is fully typed with RootState and AppDispatch

## Development Notes

### Path Aliases
- Use `@/` prefix for imports (configured in tsconfig.json)
- Example: `import { authService } from '@/services/authService'`

### Platform Considerations
- Cross-platform authentication storage
- Web support with Metro bundler
- iOS bundle identifier: `com.yes.securities`
- Android package: `com.yes.securities`

### State Management Patterns
- Use Redux for global state (documents, folders, user data)
- Use AuthContext for authentication state
- Custom hooks for complex data fetching logic

### Security Features
- JWT token validation with expiration checking
- Role-based access control
- Secure token storage across platforms