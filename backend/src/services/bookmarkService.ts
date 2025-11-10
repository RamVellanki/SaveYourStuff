import { supabase } from '../config/database';
import { CreateBookmarkDto, BookmarkFilters, Bookmark, BookmarkWithTags, Tag } from '../types';
import { AppError } from '../middleware/errorHandler';

export const createBookmark = async (
  userId: string,
  bookmarkData: CreateBookmarkDto
): Promise<Bookmark> => {
  try {
    // Start a transaction for bookmark creation with tags
    const { data: bookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        url: bookmarkData.url,
        title: bookmarkData.title,
        summary: bookmarkData.summary,
        category: bookmarkData.category, // Keep for backward compatibility
      })
      .select()
      .single();

    if (bookmarkError) throw new AppError(bookmarkError.message, 400);

    // Handle tags if provided
    if (bookmarkData.tags && bookmarkData.tags.length > 0) {
      await addTagsToBookmark(bookmark.id, bookmarkData.tags, userId);
    }

    // Return bookmark with tags populated
    return await getBookmarkWithTags(bookmark.id);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create bookmark', 500);
  }
};

export const getBookmarks = async (
  userId: string,
  filters: BookmarkFilters = {}
): Promise<Bookmark[]> => {
  try {
    // Temporarily use bookmarks table to test search functionality
    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    // Support both category (legacy) and tags filtering
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      // Filter bookmarks that have ALL specified tags (AND logic)
      const tagConditions = filters.tags.map(tag => `tags.cs.{${tag}}`).join(',');
      query = query.or(tagConditions);
    }

    // Handle date filtering with proper same-date logic
    if (filters.startDate || filters.endDate) {
      const startDate = filters.startDate;
      const endDate = filters.endDate;
      
      if (startDate && endDate && startDate === endDate) {
        // Same date: filter for exact day (from 00:00:00 to 23:59:59.999)
        const startDateTime = `${startDate}T00:00:00.000Z`;
        const endDateTime = `${endDate}T23:59:59.999Z`;
        query = query.gte('created_at', startDateTime).lte('created_at', endDateTime);
      } else {
        // Different dates or only one date provided
        if (startDate) {
          const startDateTime = startDate.includes('T') 
            ? startDate 
            : `${startDate}T00:00:00.000Z`;
          query = query.gte('created_at', startDateTime);
        }
        
        if (endDate) {
          const endDateTime = endDate.includes('T') 
            ? endDate 
            : `${endDate}T23:59:59.999Z`;
          query = query.lte('created_at', endDateTime);
        }
      }
    }

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw new AppError(error.message, 400);
    return data || [];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch bookmarks', 500);
  }
};

export const getBookmarkWithTags = async (bookmarkId: string): Promise<Bookmark> => {
  try {
    const { data, error } = await supabase
      .from('bookmarks_with_tags')
      .select('*')
      .eq('id', bookmarkId)
      .single();

    if (error) throw new AppError(error.message, 400);
    if (!data) throw new AppError('Bookmark not found', 404);

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch bookmark', 500);
  }
};

export const addTagsToBookmark = async (
  bookmarkId: string,
  tagNames: string[],
  userId: string
): Promise<void> => {
  try {
    for (const tagName of tagNames) {
      const trimmedTagName = tagName.trim();
      
      // First, try to find existing tag
      let { data: tag, error: findError } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .eq('name', trimmedTagName)
        .single();

      // If tag doesn't exist, create it
      if (findError || !tag) {
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({
            user_id: userId,
            name: trimmedTagName,
          })
          .select()
          .single();

        if (createError) {
          // If it's a duplicate key error, try to find the tag again (race condition)
          if (createError.message.includes('duplicate key')) {
            const { data: existingTag, error: retryError } = await supabase
              .from('tags')
              .select('*')
              .eq('user_id', userId)
              .eq('name', trimmedTagName)
              .single();

            if (retryError || !existingTag) {
              throw new AppError(`Failed to find or create tag: ${trimmedTagName}`, 400);
            }
            tag = existingTag;
          } else {
            throw new AppError(createError.message, 400);
          }
        } else {
          tag = newTag;
        }
      }

      // Link bookmark to tag (ignore if already linked)
      const { error: linkError } = await supabase
        .from('bookmark_tags')
        .insert({
          bookmark_id: bookmarkId,
          tag_id: tag.id,
        })
        .select();

      // Ignore duplicate key errors (tag already linked to bookmark)
      if (linkError && !linkError.message.includes('duplicate key')) {
        throw new AppError(linkError.message, 400);
      }
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to add tags to bookmark', 500);
  }
};

export const removeTagsFromBookmark = async (
  bookmarkId: string,
  tagNames: string[],
  userId: string
): Promise<void> => {
  try {
    for (const tagName of tagNames) {
      // Get tag ID
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('name', tagName.trim())
        .single();

      if (tagError || !tag) continue; // Skip if tag doesn't exist

      // Remove bookmark-tag link
      const { error: unlinkError } = await supabase
        .from('bookmark_tags')
        .delete()
        .eq('bookmark_id', bookmarkId)
        .eq('tag_id', tag.id);

      if (unlinkError) throw new AppError(unlinkError.message, 400);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to remove tags from bookmark', 500);
  }
};

export const updateBookmarkTags = async (
  bookmarkId: string,
  tagNames: string[],
  userId: string
): Promise<Bookmark> => {
  try {
    // Remove all existing tags for this bookmark
    const { error: clearError } = await supabase
      .from('bookmark_tags')
      .delete()
      .eq('bookmark_id', bookmarkId);

    if (clearError) throw new AppError(clearError.message, 400);

    // Add new tags
    if (tagNames && tagNames.length > 0) {
      await addTagsToBookmark(bookmarkId, tagNames, userId);
    }

    // Return updated bookmark with tags
    return await getBookmarkWithTags(bookmarkId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update bookmark tags', 500);
  }
};
