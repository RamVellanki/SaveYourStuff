import { supabase } from '../config/database';
import { Category } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getCategories = async (userId: string): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch categories', 500);
  }
};

export const createCategory = async (
  userId: string,
  name: string
): Promise<Category> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create category', 500);
  }
};
