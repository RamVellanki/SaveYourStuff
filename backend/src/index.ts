import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookmarkRoutes from './routes/bookmarkRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tagRoutes from './routes/tagRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/categories', categoryRoutes); // Keep for backward compatibility
app.use('/api/tags', tagRoutes); // New tag routes

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
