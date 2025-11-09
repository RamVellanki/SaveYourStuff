import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { 
  createBookmark, 
  getBookmarks, 
  getBookmarkWithTags,
  updateBookmarkTags 
} from '../services/bookmarkService';
import { CreateBookmarkDto, BookmarkFilters } from '../types';

const router = Router();

// POST /api/bookmarks - Create a new bookmark
router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const bookmarkData: CreateBookmarkDto = req.body;

    // Validate required fields
    if (!bookmarkData.url || !bookmarkData.title) {
      return res.status(400).json({
        success: false,
        error: 'URL and title are required',
      });
    }

    // Validate tags if provided
    if (bookmarkData.tags && !Array.isArray(bookmarkData.tags)) {
      return res.status(400).json({
        success: false,
        error: 'Tags must be an array of strings',
      });
    }

    const bookmark = await createBookmark(userId, bookmarkData);

    res.status(201).json({
      success: true,
      error: null,
      data: bookmark,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookmarks - Get bookmarks with filters
router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    
    // Parse tags parameter (can be comma-separated string or array)
    let tags: string[] | undefined;
    if (req.query.tags) {
      if (Array.isArray(req.query.tags)) {
        tags = req.query.tags as string[];
      } else {
        tags = (req.query.tags as string).split(',').map(tag => tag.trim());
      }
    }

    const filters: BookmarkFilters = {
      search: req.query.search as string,
      category: req.query.category as string, // Keep for backward compatibility
      tags,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const bookmarks = await getBookmarks(userId, filters);

    res.json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookmarks/:id - Get a specific bookmark with tags
router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookmarkId = req.params.id;
    const bookmark = await getBookmarkWithTags(bookmarkId);

    res.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/bookmarks/:id/tags - Update tags for a bookmark
router.put('/:id/tags', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const bookmarkId = req.params.id;
    const { tags } = req.body;

    // Validate tags parameter
    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'Tags must be an array of strings',
      });
    }

    const bookmark = await updateBookmarkTags(bookmarkId, tags, userId);

    res.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
