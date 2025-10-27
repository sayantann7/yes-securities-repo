# YES Securities Sales Repository - AI Agent Instructions

## Project Architecture

This is a **React Native/Expo** document management app for YES Securities sales team with JWT authentication and role-based access control.

### Core Technologies
- **React Native 0.79.5** + **Expo 53.0.19** with typed routes
- **Expo Router** for file-based routing (`app/` directory structure)
- **Redux Toolkit** (`store/`) for global state management
- **JWT authentication** with cross-platform secure storage
- **TypeScript** with `@/*` path aliases

### Development Commands
- `npm run dev` - Start Expo development server (telemetry disabled)
- `npm run android` / `npm run ios` - Platform-specific development
- `npm run build:web` - Web platform build via Metro bundler

## Critical Architecture Patterns

### Authentication Flow
Authentication is dual-layer: **AuthContext** for auth state + **Redux** for app data.
- **AuthContext** (`context/AuthContext.tsx`) handles JWT tokens, login/logout, role-based access
- **Cross-platform storage**: SecureStore (native) / localStorage (web) via `Platform.OS` checks
- **Token validation**: JWT expiration checking with automatic logout
- **User roles**: `admin | manager | sales` with different capabilities

### File-Based Routing Structure
```
app/
├── _layout.tsx          # Root provider setup (Redux + Auth + fonts)
├── (auth)/              # Authentication screens  
├── (app)/               # Main app (requires authentication)
│   └── (tabs)/          # Tab navigation
└── document/[id]/       # Modal document viewer
```

### Services Architecture
All API calls use dedicated service modules with **caching layer**:
- Services in `services/` follow consistent patterns with `getToken()` auth headers
- **Cache service** (`services/cache.ts`) provides TTL-based in-memory caching with prefix invalidation
- **API endpoints**: `API_BASE_URL`, `API_URL`, `USER_API_URL`, `ADMIN_API_URL` from `constants/api.ts`

### Font System Override
**Global Text/TextInput override** in `app/_layout.tsx` applies Nexa fonts consistently:
```tsx
const originalTextRender = (Text as any).render;
(Text as any).render = function render(props: any) {
  const mergedProps = { ...props, style: [customTextProps.style, props.style] };
  return originalTextRender.apply(this, [mergedProps]);
};
```

## Component Patterns

### Feature-Based Organization
Components are organized by domain in `components/`:
- `admin/` - Dashboard, user management
- `document/` - Document items, viewers, modals
- `comments/` - Threaded commenting system
- `skeleton/` - Loading states with 800ms minimum display

### State Management Strategy
- **Redux slices** for documents, folders, user data (`store/slices/`)
- **Custom hooks** for complex data fetching (`hooks/useFetch*`)
- **AuthContext** for authentication state only
- **Local state** for UI interactions (modals, selections)

### Platform-Specific Considerations
- **EAS Build**: iOS requires CocoaPods 1.15.2, bundler 2.5.10
- **Bundle IDs**: iOS `com.yes.salerepository`, Android `com.yes.salerepository`
- **Security**: Android backup disabled, iOS non-exempt encryption
- **Platform checks** throughout codebase for native vs web behavior

## Development Workflow

### TypeScript Integration
- **Comprehensive typing**: All interfaces in `types/index.ts`
- **Redux typing**: `RootState`, `AppDispatch` exported from store
- **Expo Router**: Typed routes enabled in `app.json`

### File Upload/Management
- **Document types**: PDF, images, videos with type detection from extensions
- **Thumbnail generation**: Server-side thumbnails for supported formats
- **Bookmarking system**: Toggle bookmarks with local state + API sync
- **Sharing**: Document sharing with native sharing APIs

### Error Handling Patterns
- Services return typed responses with error handling
- Cache invalidation on mutations (`invalidateByPrefix()`)
- Loading states with skeleton components
- Role-based UI rendering based on `user.role`

### Security Implementation
- **Jailbreak/root detection** with custom hooks
- **JWT token expiration** handling with automatic logout
- **Secure storage** abstraction for cross-platform token management
- **Role-based access control** throughout the app

When working with this codebase:
1. **Always use the services layer** for API calls - don't create fetch calls directly
2. **Follow the existing authentication patterns** - check `AuthContext` for user state
3. **Use the cache service** for performance - invalidate appropriately on mutations
4. **Respect the component organization** - place components in appropriate domain folders
5. **Maintain TypeScript strict typing** - update `types/index.ts` for new data structures