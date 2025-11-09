import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { getCategories, createCategory } from '../services/categoryService';

const router = Router();

router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const categories = await getCategories(userId);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required',
      });
    }

    const category = await createCategory(userId, name);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
