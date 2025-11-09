import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { 
  getTags, 
  createTag, 
  updateTag, 
  deleteTag, 
  getTagUsageStats, 
  searchTags,
  getPopularTags 
} from '../services/tagService';

const router = Router();

// GET /api/tags - Get all tags for user
router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const search = req.query.search as string;
    
    let tags;
    if (search) {
      tags = await searchTags(userId, search);
    } else {
      tags = await getTags(userId);
    }

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tags - Create a new tag
router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required and must be a non-empty string',
      });
    }

    const tag = await createTag(userId, name);

    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tags/:id - Update a tag
router.put('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const tagId = req.params.id;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required and must be a non-empty string',
      });
    }

    const tag = await updateTag(tagId, userId, name);

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const tagId = req.params.id;

    await deleteTag(tagId, userId);

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tags/stats - Get tag usage statistics
router.get('/stats', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const stats = await getTagUsageStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tags/popular - Get popular tags
router.get('/popular', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const popularTags = await getPopularTags(userId, limit);

    res.json({
      success: true,
      data: popularTags,
    });
  } catch (error) {
    next(error);
  }
});

export default router;