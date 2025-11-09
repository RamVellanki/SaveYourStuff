# Contextual Bookmarking System - Architecture Document

## System Overview

A full-stack bookmarking application that allows users to save web links with contextual notes via a browser extension and manage them through a web interface.

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Extension                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Popup UI   │  │   Content    │  │  Background  │      │
│  │   (React)    │  │   Scripts    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS/REST API
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js (TypeScript)                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │   Auth     │  │ Bookmarks  │  │ Categories │    │   │
│  │  │ Middleware │  │   Routes   │  │   Routes   │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ Supabase Client
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Layer                          │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   PostgreSQL DB      │  │    Auth Service      │        │
│  │  - bookmarks         │  │  (Google OAuth)      │        │
│  │  - categories        │  │  (Future)            │        │
│  │  - users             │  │                      │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ HTTPS/REST API
┌────────────────────────────┴────────────────────────────────┐
│                     Web Application                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React (TypeScript + Vite)                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │    Home    │  │  Timeline  │  │   Search   │    │   │
│  │  │    Page    │  │    Page    │  │  & Filters │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  │                                                       │   │
│  │         ShadCN UI Components + Tailwind              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Web Application**
  - React 18+
  - TypeScript
  - Vite (build tool)
  - ShadCN UI (component library)
  - Tailwind CSS
  - React Router (navigation)
  - Axios/Fetch (API calls)

- **Browser Extension**
  - React (for popup UI)
  - WebExtension API (Manifest V3)
  - Multi-browser support (Chrome, Edge, Comet)

### Backend
- **API Server**
  - Node.js 18+
  - TypeScript
  - Express.js
  - Supabase Client SDK
  - CORS middleware
  - Express Validator (input validation)

### Database & Auth
- **Supabase**
  - PostgreSQL database
  - Row Level Security (RLS)
  - Google OAuth (Phase 2)
  - Real-time subscriptions (Future)

### Deployment
- **Vercel**
  - Web application deployment
  - Serverless API functions
  - Environment variable management
  - Automatic HTTPS

### Development Tools
- **Claude Code** (primary development tool)
- ESLint + Prettier (code formatting)
- Git (version control)
- pnpm/npm (package management)

## System Components

### 1. Browser Extension

#### Purpose
Capture bookmarks from any webpage with context.

#### Components
- **Popup UI**: Main interface for saving bookmarks
- **Content Scripts**: Extract page metadata
- **Background Service Worker**: Manage API communication

#### Key Features (MVP)
- Auto-capture current URL and page title
- User-provided summary text area
- Category selection (dropdown + new entry)
- Save to backend API
- Success/error notifications

#### Technical Details
- Manifest V3 for modern browser compatibility
- React-based popup (bundled separately)
- LocalStorage for temporary data
- Chrome/Edge/Comet support via standard WebExtension APIs

### 2. Web Application

#### Purpose
Central hub for viewing, searching, and filtering bookmarks.

#### Pages
1. **Home Page** (`/`)
   - Display 10 most recent bookmarks
   - Card-based layout
   - Quick search bar
   - Navigation to timeline

2. **Timeline Page** (`/timeline`)
   - Chronological view of all bookmarks
   - Infinite scroll (10 items per load)
   - Filter sidebar (date, category)
   - Search integration

3. **Login Page** (`/login`) (Future)
   - Google OAuth integration
   - Mock login for MVP

#### Key Components
- **BookmarkCard**: Reusable card component
- **SearchBar**: Global search input
- **FilterPanel**: Date range + category filters
- **InfiniteScroll**: Timeline loader
- **Navigation**: Header with logo and user menu

#### State Management
- React Context API for global state
- Local component state for UI interactions
- API service layer for data fetching

### 3. Backend API

#### Purpose
Handle business logic, data persistence, and authentication.

#### Architecture Pattern
RESTful API with layered architecture:
- **Routes Layer**: Endpoint definitions
- **Middleware Layer**: Auth, validation, error handling
- **Service Layer**: Business logic
- **Data Layer**: Supabase client interactions

#### API Endpoints

**Bookmarks**
```
POST   /api/bookmarks
GET    /api/bookmarks?limit=10&offset=0&search=query&category=tech&startDate=2025-01-01&endDate=2025-12-31
GET    /api/bookmarks/:id
PUT    /api/bookmarks/:id (Future)
DELETE /api/bookmarks/:id (Future)
```

**Categories**
```
GET    /api/categories
POST   /api/categories
```

**Authentication**
```
GET    /api/auth/user (Mock for MVP)
POST   /api/auth/login (Future - OAuth)
POST   /api/auth/logout (Future)
```

#### Authentication Flow

**MVP (Mock Auth)**
```typescript
// Middleware adds mock user ID to all requests
req.userId = 'mock-user-id'
```

**Phase 2 (Supabase OAuth)**
```typescript
// Extract JWT from Authorization header
// Verify with Supabase auth service
// Add real user ID to request
req.userId = verifiedUser.id
```

#### Error Handling
- Standardized error response format
- HTTP status codes (400, 401, 404, 500)
- Detailed error messages in development
- Generic messages in production

### 4. Database Schema

#### Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**bookmarks**
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX idx_bookmarks_category ON bookmarks(category);

-- Full-text search index
CREATE INDEX idx_bookmarks_search ON bookmarks
  USING gin(to_tsvector('english', title || ' ' || summary || ' ' || url));
```

**categories**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_category UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
```

#### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies (for Phase 2 with OAuth)
CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Similar policies for categories
```

## Data Flow

### Bookmark Creation Flow
```
1. User clicks extension on webpage
2. Extension captures:
   - Current URL (from tab API)
   - Page title (from DOM)
3. User fills:
   - Summary (text input)
   - Category (dropdown/new)
4. User clicks "Save"
5. Extension sends POST request to API
6. Backend validates and saves to Supabase
7. Returns success/error to extension
8. Extension shows notification
```

### Bookmark Retrieval Flow
```
1. User opens web app
2. App requests recent bookmarks from API
3. API queries Supabase with filters/pagination
4. Returns JSON array of bookmarks
5. App renders bookmark cards
6. User scrolls (timeline)
7. App loads next page via offset pagination
```

### Search Flow
```
1. User types in search bar
2. Debounced API call with search query
3. Backend performs full-text search on:
   - Title
   - Summary
   - URL
4. Returns matching bookmarks
5. App updates display with results
```

## Security Considerations

### MVP (Mock Auth)
- All requests use hardcoded user ID
- No real authentication
- **Development only** - not production-ready

### Phase 2 (Production)
- JWT-based authentication via Supabase
- HTTPS only (enforced by Vercel)
- CORS configuration (whitelist extension origin)
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention (React's built-in escaping)

### Data Privacy
- User data isolated per user ID
- RLS enforced at database level
- No sharing between users in MVP
- GDPR considerations for future

## Scalability Considerations

### Current Design (MVP)
- Single Supabase instance
- Vercel serverless functions
- No caching layer
- Offset-based pagination

### Future Optimizations
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets via Vercel Edge Network
- **Database**: Connection pooling, read replicas
- **Pagination**: Cursor-based for better performance
- **Search**: Dedicated search service (Algolia/Meilisearch)
- **Real-time**: Supabase real-time subscriptions

## Development Phases

### Phase 1: MVP (Current)
- Mock authentication
- Basic CRUD operations
- Simple search and filters
- Extension for Chrome/Edge/Comet
- Web app with home and timeline

### Phase 2: Authentication & Enhancement
- Supabase Google OAuth
- Category auto-suggestions
- Rich metadata capture
- Bookmark editing/deletion
- Improved error handling

### Phase 3: Advanced Features
- Real-time sync across devices
- Safari and Firefox extensions
- Export/import functionality
- Bookmark sharing (optional)
- Analytics dashboard

## Project Structure
```
project-root/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── config/               # Configuration files
│   │   │   ├── database.ts       # Supabase client setup
│   │   │   └── env.ts            # Environment variables
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.ts           # Authentication middleware
│   │   │   ├── errorHandler.ts  # Error handling
│   │   │   └── validator.ts     # Input validation
│   │   ├── routes/               # API routes
│   │   │   ├── bookmarks.ts
│   │   │   ├── categories.ts
│   │   │   └── auth.ts
│   │   ├── services/             # Business logic
│   │   │   ├── bookmarkService.ts
│   │   │   └── categoryService.ts
│   │   └── types/                # TypeScript types
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── web-app/
│   ├── src/
│   │   ├── main.tsx              # App entry point
│   │   ├── App.tsx               # Root component
│   │   ├── components/           # Reusable components
│   │   │   ├── BookmarkCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── InfiniteScroll.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── Login.tsx
│   │   ├── services/             # API service layer
│   │   │   └── api.ts
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useBookmarks.ts
│   │   ├── context/              # React Context
│   │   │   └── AuthContext.tsx
│   │   └── types/                # TypeScript types
│   │       └── index.ts
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── extension/
│   ├── manifest.json             # Extension manifest (V3)
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.tsx             # React popup UI
│   │   └── popup.css
│   ├── background/
│   │   └── service-worker.ts     # Background service worker
│   ├── content/
│   │   └── content-script.ts     # Content scripts (future)
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── package.json
│
├── shared/
│   └── types.ts                  # Shared TypeScript types
│
├── .gitignore
├── README.md
└── package.json                  # Root workspace config
```

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://your-extension-id
```

### Web App (.env)
```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Extension (config.ts)
```typescript
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-api.vercel.app'
  : 'http://localhost:3001';
```

## Deployment Strategy

### Development
- Backend: `npm run dev` (nodemon)
- Web App: `npm run dev` (Vite dev server)
- Extension: Load unpacked in browser

### Production

**Backend (Vercel)**
```
1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy (automatic on push to main)
```

**Web App (Vercel)**
```
1. Build: npm run build
2. Deploy dist folder to Vercel
3. Configure custom domain (optional)
```

**Extension (Browser Stores)**
```
1. Build: npm run build
2. Zip dist folder
3. Upload to Chrome Web Store / Edge Add-ons
4. Submit for review
```

## Monitoring & Logging

### Development
- Console.log for debugging
- Browser DevTools for frontend
- VS Code debugger for backend

### Production (Future)
- Vercel Analytics for web app
- Sentry for error tracking
- Supabase logs for database queries
- Custom logging middleware

## Testing Strategy (Future Phases)

### Unit Tests
- Jest for backend services
- React Testing Library for components

### Integration Tests
- Supertest for API endpoints
- Playwright for E2E web app tests

### Extension Tests
- Manual testing across browsers
- Automated UI tests (Puppeteer)

## Documentation

### Code Documentation
- JSDoc comments for functions
- README in each module
- Inline comments for complex logic

### API Documentation
- OpenAPI/Swagger spec (Future)
- Postman collection for testing

### User Documentation
- Extension usage guide
- Web app feature walkthrough
- FAQ section

---

**Document Version**: 1.0
**Last Updated**: 2025-11-08
**Status**: MVP Phase
