import { supabase } from '../config/database';
import { Tag } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getTags = async (userId: string): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch tags', 500);
  }
};

export const createTag = async (
  userId: string,
  name: string
): Promise<Tag> => {
  try {
    const trimmedName = name.trim();
    
    // First check if tag already exists
    const { data: existingTag, error: findError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .eq('name', trimmedName)
      .single();

    // If tag exists, return it
    if (!findError && existingTag) {
      return existingTag;
    }

    // Create new tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: trimmedName,
      })
      .select()
      .single();

    if (error) {
      // If duplicate key error, fetch the existing tag
      if (error.message.includes('duplicate key')) {
        const { data: retryTag, error: retryError } = await supabase
          .from('tags')
          .select('*')
          .eq('user_id', userId)
          .eq('name', trimmedName)
          .single();

        if (retryError || !retryTag) {
          throw new AppError(`Failed to create or find tag: ${trimmedName}`, 400);
        }
        return retryTag;
      }
      throw new AppError(error.message, 400);
    }
    
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create tag', 500);
  }
};

export const updateTag = async (
  tagId: string,
  userId: string,
  name: string
): Promise<Tag> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .update({ name: name.trim() })
      .eq('id', tagId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError('Tag not found', 404);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update tag', 500);
  }
};

export const deleteTag = async (
  tagId: string,
  userId: string
): Promise<void> => {
  try {
    // Delete tag (this will cascade delete bookmark_tags relationships)
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);

    if (error) throw new AppError(error.message, 400);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete tag', 500);
  }
};

export const getTagUsageStats = async (userId: string): Promise<Array<{ tag: Tag; count: number }>> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select(`
        *,
        bookmark_tags (count)
      `)
      .eq('user_id', userId);

    if (error) throw new AppError(error.message, 400);

    return (data || []).map(tag => ({
      tag: {
        id: tag.id,
        user_id: tag.user_id,
        name: tag.name,
        created_at: tag.created_at
      },
      count: tag.bookmark_tags?.length || 0
    }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch tag usage stats', 500);
  }
};

export const searchTags = async (
  userId: string,
  searchTerm: string
): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) throw new AppError(error.message, 400);
    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to search tags', 500);
  }
};

export const getPopularTags = async (
  userId: string,
  limit: number = 10
): Promise<Array<{ tag: Tag; count: number }>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_popular_tags', {
        user_uuid: userId,
        tag_limit: limit
      });

    if (error) throw new AppError(error.message, 400);
    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch popular tags', 500);
  }
};