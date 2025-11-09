# FULL MVP DEVELOPMENT PROMPT - Contextual Bookmarking System

## Objective
Build a complete, working end-to-end contextual bookmarking system from scratch. This system allows users to save web links with contextual notes via a browser extension and manage them through a web application.

---

## Project Scope - MVP Features Only

### What We're Building (In Scope)
✅ Browser extension (Chrome, Edge, Comet) to capture bookmarks  
✅ Web application with home page and timeline view  
✅ Backend REST API with mock authentication  
✅ PostgreSQL database via Supabase  
✅ Basic search and filtering  
✅ Manual category assignment  
✅ Pagination (offset-based)  

### What We're NOT Building (Out of Scope for MVP)
❌ Real Google OAuth (use mock auth)  
❌ Real-time sync across devices  
❌ Auto-suggested categories  
❌ Rich metadata (favicons, screenshots, OG tags)  
❌ Bookmark editing/deletion  
❌ Safari/Firefox extensions  
❌ Export/import functionality  
❌ Collaborative features  

---

## Technology Stack

### Frontend
- **Web App**: React 18+, TypeScript, Vite, ShadCN UI, Tailwind CSS
- **Extension**: React for popup, WebExtension API (Manifest V3)

### Backend
- **API**: Node.js 18+, TypeScript, Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Mock authentication (hardcoded user ID)

### Deployment
- **Hosting**: Vercel (web app + API)
- **Extension**: Unpacked load for development

### Tools
- Claude Code for development
- Git for version control
- pnpm or npm for package management

---

## Database Schema

Create these tables in Supabase:
```sql
-- Users table (for future OAuth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert mock user for development
INSERT INTO users (id, email, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'mock@example.com', 'Mock User');

-- Bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX idx_bookmarks_category ON bookmarks(category);

-- Full-text search index
CREATE INDEX idx_bookmarks_search ON bookmarks 
  USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(summary, '') || ' ' || COALESCE(url, '')));

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_category UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
```

---

## Project Structure
```
project-root/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express app entry
│   │   ├── config/
│   │   │   └── database.ts          # Supabase client
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Mock auth middleware
│   │   │   ├── errorHandler.ts
│   │   │   └── validator.ts
│   │   ├── routes/
│   │   │   ├── bookmarks.ts
│   │   │   └── categories.ts
│   │   ├── services/
│   │   │   ├── bookmarkService.ts
│   │   │   └── categoryService.ts
│   │   └── types/
│   │       └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── web-app/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # ShadCN components
│   │   │   ├── BookmarkCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── InfiniteScroll.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   └── Timeline.tsx
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── hooks/
│   │   │   └── useBookmarks.ts
│   │   └── types/
│   │       └── index.ts
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── components.json              # ShadCN config
│
├── extension/
│   ├── manifest.json                # Manifest V3
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.tsx
│   │   └── styles.css
│   ├── background/
│   │   └── service-worker.ts
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── config.ts                    # API URL config
│   ├── package.json
│   └── webpack.config.js            # Bundle popup
│
├── shared/
│   └── types.ts                     # Shared TypeScript types
│
├── .gitignore
├── README.md
└── package.json                     # Workspace root
```

---

## Shared TypeScript Types

Create in `/shared/types.ts`:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  url: string;
  title: string;
  summary: string;
  category: string;
  createdAt: string;
}

export interface CreateBookmarkDto {
  url: string;
  title: string;
  summary: string;
  category: string;
}

export interface UpdateBookmarkDto {
  title?: string;
  summary?: string;
  category?: string;
}

export interface BookmarkFilters {
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## Backend Development

### 1. Setup & Configuration

**Install dependencies:**
```bash
cd backend
npm init -y
npm install express cors dotenv @supabase/supabase-js
npm install -D typescript @types/express @types/cors @types/node ts-node nodemon
npx tsc --init
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**.env.example:**
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://your-extension-id
```

### 2. Database Configuration

**src/config/database.ts:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 3. Middleware

**src/middleware/auth.ts** (Mock Auth):
```typescript
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Mock authentication - always use this user ID
  req.userId = '00000000-0000-0000-0000-000000000001';
  next();
};

// Future: Real Supabase OAuth implementation
// export const authWithSupabase = async (req: Request, res: Response, next: NextFunction) => {
//   const token = req.headers.authorization?.split('Bearer ')[1];
//   if (!token) {
//     return res.status(401).json({ success: false, error: 'Unauthorized' });
//   }
//   const { data: { user }, error } = await supabase.auth.getUser(token);
//   if (error || !user) {
//     return res.status(401).json({ success: false, error: 'Invalid token' });
//   }
//   req.userId = user.id;
//   next();
// };
```

**src/middleware/errorHandler.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

### 4. Services Layer

**src/services/bookmarkService.ts:**
```typescript
import { supabase } from '../config/database';
import { Bookmark, CreateBookmarkDto, BookmarkFilters } from '../../shared/types';
import { AppError } from '../middleware/errorHandler';

export const createBookmark = async (
  userId: string,
  data: CreateBookmarkDto
): Promise<Bookmark> => {
  const { data: bookmark, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      url: data.url,
      title: data.title,
      summary: data.summary,
      category: data.category
    })
    .select()
    .single();

  if (error) {
    throw new AppError(500, 'Failed to create bookmark');
  }

  return bookmark as Bookmark;
};

export const getBookmarks = async (
  userId: string,
  filters: BookmarkFilters
): Promise<Bookmark[]> => {
  let query = supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Apply search filter
  if (filters.search) {
    query = query.textSearch('title,summary,url', filters.search);
  }

  // Apply category filter
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  // Apply date range filters
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  // Pagination
  const limit = filters.limit || 10;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new AppError(500, 'Failed to fetch bookmarks');
  }

  return data as Bookmark[];
};
```

**src/services/categoryService.ts:**
```typescript
import { supabase } from '../config/database';
import { Category } from '../../shared/types';
import { AppError } from '../middleware/errorHandler';

export const getCategories = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new AppError(500, 'Failed to fetch categories');
  }

  return data as Category[];
};

export const createCategory = async (
  userId: string,
  name: string
): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new AppError(409, 'Category already exists');
    }
    throw new AppError(500, 'Failed to create category');
  }

  return data as Category;
};
```

### 5. Routes

**src/routes/bookmarks.ts:**
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import * as bookmarkService from '../services/bookmarkService';
import { CreateBookmarkDto } from '../../shared/types';

const router = Router();

// POST /api/bookmarks
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const bookmarkData: CreateBookmarkDto = req.body;
    
    // Basic validation
    if (!bookmarkData.url || !bookmarkData.title) {
      return res.status(400).json({
        success: false,
        error: 'URL and title are required'
      });
    }

    const bookmark = await bookmarkService.createBookmark(userId, bookmarkData);
    
    res.status(201).json({
      success: true,
      data: bookmark
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookmarks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const filters = {
      search: req.query.search as string,
      category: req.query.category as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: parseInt(req.query.limit as string) || 10,
      offset: parseInt(req.query.offset as string) || 0
    };

    const bookmarks = await bookmarkService.getBookmarks(userId, filters);
    
    res.json({
      success: true,
      data: bookmarks
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

**src/routes/categories.ts:**
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categoryService';

const router = Router();

// GET /api/categories
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const categories = await categoryService.getCategories(userId);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    const category = await categoryService.createCategory(userId, name);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### 6. Main Application

**src/index.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { auth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import bookmarkRoutes from './routes/bookmarks';
import categoryRoutes from './routes/categories';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes (require auth)
app.use('/api/bookmarks', auth, bookmarkRoutes);
app.use('/api/categories', auth, categoryRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## Web Application Development

### 1. Setup

**Initialize project:**
```bash
cd web-app
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom axios date-fns
npx shadcn-ui@latest init
```

**Install ShadCN components:**
```bash
npx shadcn-ui@latest add button card input select badge
```

**.env.example:**
```
VITE_API_URL=http://localhost:3001
```

### 2. API Service

**src/services/api.ts:**
```typescript
import axios from 'axios';
import { Bookmark, CreateBookmarkDto, BookmarkFilters, Category } from '../../shared/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'An error occurred';
    throw new Error(message);
  }
);

export const bookmarkApi = {
  create: (data: CreateBookmarkDto) => 
    api.post<any, { data: Bookmark }>('/api/bookmarks', data),
  
  getAll: (filters: BookmarkFilters) => 
    api.get<any, { data: Bookmark[] }>('/api/bookmarks', { params: filters }),
  
  search: (query: string) => 
    api.get<any, { data: Bookmark[] }>('/api/bookmarks', { 
      params: { search: query } 
    })
};

export const categoryApi = {
  getAll: () => 
    api.get<any, { data: Category[] }>('/api/categories'),
  
  create: (name: string) => 
    api.post<any, { data: Category }>('/api/categories', { name })
};
```

### 3. Custom Hooks

**src/hooks/useBookmarks.ts:**
```typescript
import { useState, useEffect } from 'react';
import { Bookmark, BookmarkFilters } from '../../shared/types';
import { bookmarkApi } from '../services/api';

export const useBookmarks = (filters: BookmarkFilters = {}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await bookmarkApi.getAll(filters);
        setBookmarks(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [JSON.stringify(filters)]);

  return { bookmarks, loading, error, refetch: () => {} };
};
```

### 4. Components

**src/components/BookmarkCard.tsx:**
```typescript
import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark } from '../../shared/types';
import { formatDistanceToNow } from 'date-fns';

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export const BookmarkCard: FC<BookmarkCardProps> = ({ bookmark }) => {
  const truncateUrl = (url: string, maxLength = 50) => {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{bookmark.title}</CardTitle>
          {bookmark.category && (
            <Badge variant="secondary">{bookmark.category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <a 
          href={bookmark.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          {truncateUrl(bookmark.url)}
        </a>
        {bookmark.summary && (
          <p className="mt-2 text-gray-600">{bookmark.summary}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
};
```

**src/components/SearchBar.tsx:**
```typescript
import { FC, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounced search
    setTimeout(() => {
      onSearch(value);
    }, 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <Input
        type="text"
        placeholder="Search bookmarks..."
        value={query}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
};
```

**src/components/FilterPanel.tsx:**
```typescript
import { FC } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '../../shared/types';

interface FilterPanelProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const FilterPanel: FC<FilterPanelProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
```

**src/components/InfiniteScroll.tsx:**
```typescript
import { FC, useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export const InfiniteScroll: FC<InfiniteScrollProps> = ({
  onLoadMore,
  hasMore,
  loading
}) => {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div ref={observerRef} className="py-4 text-center">
      {loading && <p>Loading more...</p>}
      {!hasMore && <p className="text-gray-400">No more bookmarks</p>}
    </div>
  );
};
```

### 5. Pages

**src/pages/Home.tsx:**
```typescript
import { FC, useState, useEffect } from 'react';
import { BookmarkCard } from '../components/BookmarkCard';
import { SearchBar } from '../components/SearchBar';
import { useBookmarks } from '../hooks/useBookmarks';

export const Home: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { bookmarks, loading, error } = useBookmarks({ 
    limit: 10,
    search: searchQuery 
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Recent Bookmarks</h1>
      
      <div className="mb-6">
        <SearchBar onSearch={setSearchQuery} />
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}

      {!loading && bookmarks.length === 0 && (
        <p className="text-center text-gray-500">No bookmarks found</p>
      )}
    </div>
  );
};
```

**src/pages/Timeline.tsx:**
```typescript
import { FC, useState, useEffect } from 'react';
import { BookmarkCard } from '../components/BookmarkCard';
import { FilterPanel } from '../components/FilterPanel';
import { InfiniteScroll } from '../components/InfiniteScroll';
import { bookmarkApi, categoryApi } from '../services/api';
import { Bookmark, Category } from '../../shared/types';

export const Timeline: FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 10;

  useEffect(() => {
    // Fetch categories
    categoryApi.getAll().then((result) => {
      setCategories(result.data);
    });
  }, []);

  useEffect(() => {
    // Reset and fetch bookmarks when category changes
    setBookmarks([]);
    setOffset(0);
    setHasMore(true);
    fetchBookmarks(0);
  }, [selectedCategory]);

  const fetchBookmarks = async (currentOffset: number) => {
    setLoading(true);
    try {
      const filters = {
        limit: LIMIT,
        offset: currentOffset,
        category: selectedCategory === 'all' ? undefined : selectedCategory
      };
      
      const result = await bookmarkApi.getAll(filters);
      
      if (result.data.length < LIMIT) {
        setHasMore(false);
      }
      
      setBookmarks((prev) => [...prev, ...result.data]);
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchBookmarks(offset);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Timeline</h1>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <FilterPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} />
            ))}
          </div>

          <InfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
```

### 6. Routing

**src/App.tsx:**
```typescript
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Timeline } from './pages/Timeline';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Contextual Bookmarks</h1>
            <nav className="space-x-4">
              <Link to="/" className="text-blue-600 hover:underline">
                Home
              </Link>
              <Link to="/timeline" className="text-blue-600 hover:underline">
                Timeline
              </Link>
            </nav>
          </div>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

---

## Browser Extension Development

### 1. Setup

**Initialize:**
```bash
cd extension
npm init -y
npm install react react-dom
npm install -D @types/react @types/react-dom @types/chrome typescript webpack webpack-cli ts-loader css-loader style-loader html-webpack-plugin copy-webpack-plugin
```

### 2. Manifest

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Contextual Bookmarks",
  "version": "1.0.0",
  "description": "Save bookmarks with context",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "http://localhost:3001/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 3. Config

**config.ts:**
```typescript
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-api.vercel.app'
  : 'http://localhost:3001';
```

### 4. Popup UI

**popup/popup.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Save Bookmark</title>
</head>
<body>
  <div id="root"></div>
  <script src="popup.js"></script>
</body>
</html>
```

**popup/popup.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { API_URL } from '../config';
import './styles.css';

interface Category {
  id: string;
  name: string;
}

const Popup: React.FC = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setUrl(tabs[0].url || '');
        setTitle(tabs[0].title || '');
      }
    });

    // Fetch categories
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((result) => {
        setCategories(result.data);
      })
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          title,
          summary,
          category
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Bookmark saved successfully!');
        setTimeout(() => window.close(), 1500);
      } else {
        setMessage('Failed to save bookmark');
      }
    } catch (error) {
      setMessage('Error saving bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-container">
      <h2>Save Bookmark</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Add your notes..."
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter or select category"
          />
          <datalist id="categories">
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name} />
            ))}
          </datalist>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Bookmark'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />);
```

**popup/styles.css:**
```css
body {
  width: 400px;
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.popup-container {
  padding: 20px;
}

h2 {
  margin-top: 0;
  font-size: 18px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.message.success {
  background-color: #d1fae5;
  color: #065f46;
}

.message.error {
  background-color: #fee2e2;
  color: #991b1b;
}
```

### 5. Webpack Configuration

**webpack.config.js:**
```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './popup/popup.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './popup/popup.html',
      filename: 'popup/popup.html',
      chunks: ['popup']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ]
};
```

**package.json scripts:**
```json
{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch"
  }
}
```

---

## Development Workflow

### Step-by-Step Execution

#### Phase 1: Backend (30 min)
1. Set up project structure
2. Configure Supabase connection
3. Implement mock auth middleware
4. Create bookmark and category services
5. Build API routes
6. Test with Postman/curl

#### Phase 2: Database (15 min)
1. Create Supabase project
2. Run SQL schema
3. Insert mock user
4. Verify tables and indexes

#### Phase 3: Web App (60 min)
1. Initialize Vite + React + TypeScript
2. Install ShadCN and configure Tailwind
3. Create API service layer
4. Build reusable components
5. Implement Home page
6. Implement Timeline page with infinite scroll
7. Add routing

#### Phase 4: Extension (45 min)
1. Set up project with Webpack
2. Create manifest.json
3. Build popup React UI
4. Implement bookmark saving
5. Add category dropdown
6. Build and test in Chrome

#### Phase 5: Integration Testing (30 min)
1. Test full flow: Extension → API → Database → Web App
2. Test search functionality
3. Test filtering by category
4. Test timeline infinite scroll
5. Test across Chrome and Edge

---

## Testing Checklist

### Backend
- [ ] Health check endpoint responds
- [ ] POST /api/bookmarks creates bookmark
- [ ] GET /api/bookmarks returns bookmarks with pagination
- [ ] Search query filters results correctly
- [ ] Category filter works
- [ ] GET /api/categories returns user categories
- [ ] POST /api/categories creates new category

### Web App
- [ ] Home page displays 10 recent bookmarks
- [ ] Search bar filters bookmarks
- [ ] Timeline loads bookmarks incrementally
- [ ] Filter panel updates results
- [ ] Infinite scroll triggers next page load
- [ ] Bookmark cards display all information
- [ ] Links open in new tabs

### Extension
- [ ] Popup opens and shows current page info
- [ ] URL and title auto-populate
- [ ] Category dropdown shows existing categories
- [ ] Can enter new category
- [ ] Save button creates bookmark
- [ ] Success message appears
- [ ] Extension works in Chrome and Edge

### Integration
- [ ] Bookmark saved in extension appears in web app
- [ ] Search finds newly created bookmarks
- [ ] Category filter includes new categories
- [ ] Timeline shows bookmarks in chronological order

---

## Deployment

### Backend to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Configure:
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Deploy

### Web App to Vercel

1. Connect repo to Vercel
2. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Set environment variables:
   - `VITE_API_URL` (your backend URL)
4. Deploy

### Extension

1. Build: `npm run build`
2. Load `dist` folder as unpacked extension in Chrome
3. Test functionality
4. (Future) Publish to Chrome Web Store

---

## Next Steps (Phase 2)

After MVP is complete and tested:
1. Implement real Supabase Google OAuth
2. Add category auto-suggestions
3. Capture rich metadata (favicons, OG tags)
4. Implement bookmark editing/deletion
5. Add export functionality
6. Build Safari and Firefox extensions
7. Set up real-time sync via Supabase subscriptions

---

## Success Criteria

MVP is complete when:
✅ User can save bookmarks from extension  
✅ Bookmarks appear in web app immediately  
✅ Search finds bookmarks by title/summary/URL  
✅ Timeline shows chronological view with pagination  
✅ Categories can be manually assigned  
✅ Filter by category works  
✅ Extension works in Chrome and Edge  
✅ All components use ShadCN styling  
✅ Code is properly typed with TypeScript  
✅ No console errors in development  

---

**START BUILDING NOW!**

Begin with Step 1 (Backend Setup) and work through each phase sequentially. Test each component before moving to the next. Good luck! 🚀