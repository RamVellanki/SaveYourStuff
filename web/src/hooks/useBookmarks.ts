import { useState, useEffect, useCallback } from 'react';
import { bookmarkApi } from '../api';
import { Bookmark, BookmarkFilters } from '../types';

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  refetch: (filters?: BookmarkFilters) => Promise<void>;
}

export const useBookmarks = (initialFilters?: BookmarkFilters): UseBookmarksReturn => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async (filters?: BookmarkFilters) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bookmarkApi.getAll(filters);
      setBookmarks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch your stuff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks(initialFilters);
  }, [fetchBookmarks, initialFilters]);

  return {
    bookmarks,
    loading,
    error,
    refetch: fetchBookmarks,
  };
};
