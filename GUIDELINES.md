# Development Guidelines - Contextual Bookmarking System

## Code Style & Standards

### TypeScript

#### General Rules
- **Strict mode enabled**: All TypeScript projects use `"strict": true`
- **No `any` types**: Use `unknown` or proper types instead
- **Explicit return types**: Always declare function return types
- **Interface over type**: Prefer `interface` for object shapes, `type` for unions/intersections

#### Naming Conventions
```typescript
// PascalCase for types, interfaces, classes, React components
interface BookmarkData { }
class BookmarkService { }
const BookmarkCard: React.FC = () => { };

// camelCase for variables, functions, methods
const fetchBookmarks = async () => { };
const bookmarkList = [];

// UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRIES = 3;

// Prefix interfaces with 'I' only when necessary to avoid naming conflicts
// Generally, avoid the prefix
interface Bookmark { }  // Good
interface IBookmark { }  // Only if needed
```

#### Type Definitions
```typescript
// Use shared types across frontend and backend
// Location: /shared/types.ts

export interface Bookmark {
  id: string;
  userId: string;
  url: string;
  title: string;
  summary: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookmarkDto {
  url: string;
  title: string;
  summary: string;
  category: string;
}

export interface BookmarkFilters {
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

### React

#### Component Structure
```typescript
// Functional components with TypeScript
import { FC } from 'react';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
}

export const BookmarkCard: FC<BookmarkCardProps> = ({ bookmark, onDelete }) => {
  // 1. Hooks at the top
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 2. Event handlers
  const handleDelete = () => {
    onDelete?.(bookmark.id);
  };
  
  // 3. Render
  return (
    <div className="bookmark-card">
      {/* JSX */}
    </div>
  );
};
```

#### Hooks Guidelines
- **Custom hooks prefix**: Always start with `use` (e.g., `useBookmarks`)
- **Dependency arrays**: Always specify dependencies correctly
- **Cleanup**: Return cleanup functions for subscriptions/timers
```typescript
// Good custom hook example
export const useBookmarks = (filters: BookmarkFilters) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await api.getBookmarks(filters);
        setBookmarks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]); // Proper dependency

  return { bookmarks, loading, error };
};
```

#### Component Organization
```
components/
├── ui/                    # ShadCN UI components
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── common/                # Shared components
│   ├── Header.tsx
│   └── Footer.tsx
├── bookmark/              # Feature-specific components
│   ├── BookmarkCard.tsx
│   ├── BookmarkList.tsx
│   └── BookmarkForm.tsx
└── layout/                # Layout components
    └── MainLayout.tsx
```

### Backend (Express + TypeScript)

#### Route Structure
```typescript
// routes/bookmarks.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validator';
import * as bookmarkController from '../controllers/bookmarkController';

const router = Router();

// All routes require authentication
router.use(auth);

// GET /api/bookmarks
router.get('/', bookmarkController.getBookmarks);

// POST /api/bookmarks with validation
router.post(
  '/',
  [
    body('url').isURL(),
    body('title').notEmpty().trim(),
    body('summary').optional().trim(),
    body('category').optional().trim(),
    validate // Validation middleware
  ],
  bookmarkController.createBookmark
);

export default router;
```

#### Controller Pattern
```typescript
// controllers/bookmarkController.ts
import { Request, Response, NextFunction } from 'express';
import * as bookmarkService from '../services/bookmarkService';

export const getBookmarks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId; // From auth middleware
    const filters = req.query;
    
    const bookmarks = await bookmarkService.getBookmarks(userId, filters);
    
    res.json({
      success: true,
      data: bookmarks
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

#### Service Layer
```typescript
// services/bookmarkService.ts
import { supabase } from '../config/database';
import { Bookmark, BookmarkFilters } from '../../shared/types';

export const getBookmarks = async (
  userId: string,
  filters: BookmarkFilters
): Promise<Bookmark[]> => {
  let query = supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.search) {
    query = query.textSearch('title', filters.search);
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  // Pagination
  const limit = filters.limit || 10;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  
  if (error) throw error;
  return data as Bookmark[];
};
```

### Error Handling

#### Backend Error Pattern
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
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
      message: err.message
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

// Usage in routes
throw new AppError(404, 'Bookmark not found');
```

#### Frontend Error Handling
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Response interceptor for errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message);
    } else if (error.request) {
      // No response received
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('An unexpected error occurred.');
    }
  }
);
```

## Git Workflow

### Branch Strategy
```
main                    # Production-ready code
├── develop            # Integration branch
    ├── feature/xxx    # New features
    ├── fix/xxx        # Bug fixes
    └── refactor/xxx   # Code refactoring
```

### Commit Message Convention
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(extension): add category autocomplete
fix(api): resolve bookmark search pagination bug
docs(readme): update setup instructions
refactor(ui): extract BookmarkCard component
```

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes with clear commits
3. Test locally
4. Create PR with description:
   - What changed
   - Why it changed
   - Testing done
5. Request review
6. Merge after approval

## Testing Guidelines

### Unit Tests (Future)
```typescript
// Example: bookmarkService.test.ts
describe('BookmarkService', () => {
  describe('getBookmarks', () => {
    it('should return bookmarks for valid user', async () => {
      const userId = 'test-user';
      const bookmarks = await bookmarkService.getBookmarks(userId, {});
      
      expect(bookmarks).toBeInstanceOf(Array);
      expect(bookmarks.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const bookmarks = await bookmarkService.getBookmarks('test-user', {
        category: 'tech'
      });
      
      bookmarks.forEach(b => {
        expect(b.category).toBe('tech');
      });
    });
  });
});
```

### Component Tests (Future)
```typescript
// Example: BookmarkCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkCard } from './BookmarkCard';

describe('BookmarkCard', () => {
  const mockBookmark = {
    id: '1',
    title: 'Test',
    url: 'https://test.com',
    summary: 'Test summary',
    category: 'tech',
    createdAt: '2025-01-01'
  };

  it('renders bookmark information', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('tech')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const handleDelete = jest.fn();
    render(<BookmarkCard bookmark={mockBookmark} onDelete={handleDelete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(handleDelete).toHaveBeenCalledWith('1');
  });
});
```

## Performance Guidelines

### Frontend Optimization
```typescript
// 1. Memoization for expensive calculations
const sortedBookmarks = useMemo(
  () => bookmarks.sort((a, b) => b.createdAt - a.createdAt),
  [bookmarks]
);

// 2. Callback memoization to prevent re-renders
const handleDelete = useCallback(
  (id: string) => {
    deleteBookmark(id);
  },
  [deleteBookmark]
);

// 3. Component memoization
export const BookmarkCard = memo<BookmarkCardProps>(({ bookmark }) => {
  // Component logic
});

// 4. Lazy loading for routes
const Timeline = lazy(() => import('./pages/Timeline'));
```

### Backend Optimization
```typescript
// 1. Database query optimization
// Use indexes, limit fields, avoid N+1 queries

// Bad: N+1 query
const bookmarks = await getBookmarks();
for (const bookmark of bookmarks) {
  bookmark.user = await getUser(bookmark.userId);
}

// Good: Single query with join
const bookmarks = await supabase
  .from('bookmarks')
  .select('*, users(name, email)')
  .eq('user_id', userId);

// 2. Pagination best practices
// Always use limits and offsets
const { data } = await supabase
  .from('bookmarks')
  .select('*')
  .range(offset, offset + limit - 1);
```

## Security Best Practices

### Input Validation
```typescript
// Always validate user input
import { body, validationResult } from 'express-validator';

router.post(
  '/bookmarks',
  [
    body('url').isURL().withMessage('Valid URL required'),
    body('title').trim().notEmpty().escape(),
    body('summary').optional().trim().escape()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

### Environment Variables
```typescript
// Never commit secrets to Git
// Use environment variables

// .env.example (commit this)
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here

// .env (add to .gitignore)
SUPABASE_URL=https://actual-url.supabase.co
SUPABASE_ANON_KEY=actual_key_here

// Access in code
const supabaseUrl = process.env.SUPABASE_URL;
```

### CORS Configuration
```typescript
// backend/src/index.ts
import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## Documentation Standards

### Code Comments
```typescript
/**
 * Fetches bookmarks for a user with optional filters
 * 
 * @param userId - The ID of the user
 * @param filters - Optional filters for bookmarks
 * @returns Promise resolving to array of bookmarks
 * @throws {AppError} If database query fails
 * 
 * @example
 * const bookmarks = await getBookmarks('user-123', {
 *   category: 'tech',
 *   limit: 10
 * });
 */
export const getBookmarks = async (
  userId: string,
  filters: BookmarkFilters
): Promise<Bookmark[]> => {
  // Implementation
};
```

### README Structure
Each module should have a README with:
1. **Purpose**: What this module does
2. **Setup**: How to install and configure
3. **Usage**: Code examples
4. **API**: Available functions/endpoints
5. **Development**: How to contribute

## ShadCN Component Usage

### Installation
```bash
# Install ShadCN components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

### Usage Pattern
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const BookmarkCard: FC<Props> = ({ bookmark }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{bookmark.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{bookmark.summary}</p>
        <Button variant="outline" onClick={handleDelete}>
          Delete
        </Button>
      </CardContent>
    </Card>
  );
};
```

## Extension Development

### Manifest V3 Structure
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
    "http://localhost:3001/*",
    "https://your-api.vercel.app/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background/service-worker.js"
  }
}
```

### Browser Compatibility
```typescript
// Use chrome.* APIs (works in Chrome, Edge, Opera)
// For Firefox compatibility, use browser.* APIs

// Cross-browser helper
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Usage
browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  console.log(currentTab.url);
});
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Environment variables set in Vercel
- [ ] Build succeeds locally
- [ ] Database migrations applied
- [ ] API endpoints tested
- [ ] Extension tested in target browsers

### Post-deployment
- [ ] Verify production URLs work
- [ ] Test critical user flows
- [ ] Check error logging
- [ ] Monitor performance
- [ ] Update documentation

## Common Pitfalls to Avoid

1. **Not handling loading states**: Always show loading indicators
2. **Missing error boundaries**: Wrap app in error boundary
3. **Hardcoded URLs**: Use environment variables
4. **No input validation**: Validate on both client and server
5. **Ignoring TypeScript errors**: Fix all type errors before merging
6. **Not cleaning up effects**: Return cleanup functions
7. **Exposing sensitive data**: Never log tokens or keys
8. **Poor accessibility**: Use semantic HTML and ARIA labels

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-08